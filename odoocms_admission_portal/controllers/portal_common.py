# -*- coding: utf-8 -*-
"""Shared helpers for the admission portal controllers.

Historically this codebase assumed a strict 1-login-per-application model:
`res.users.login` was literally set to the application's reference number
(`odoocms.application.application_no`), so every new program application
created a *brand new* user account. That made it impossible for a single
candidate to sign up once and apply to more than one program/register with
the same credentials.

`odoocms.application` already had a proper `user_id` (Many2one res.users)
field that was never really used for lookups - so the fix is to use it as
the real relation between a candidate (res.users) and their application(s),
and to stop keying applications off the login.

Because a candidate can now own *several* applications, controllers that
work on "the current application" (the multi-step application form, save
handlers, downloads, etc.) need a way to know which one is currently being
worked on. `_get_current_application` resolves that in a predictable way:

    1. an explicit `application_id` (e.g. the "Continue" button on the
       dashboard, or a `?application_id=` query string),
    2. the application stored on the browser session from a previous step,
    3. legacy fallback: the candidate's most recent application - this
       keeps old bookmarks/links/emails working for candidates who only
       ever had a single application.

Any resolved application is always re-validated against
`application.user_id == request.env.user`, so a candidate can never end up
looking at (or editing) someone else's application by guessing an id.
"""
from odoo.http import request


class PortalApplicationMixin(object):

    def _is_internal_user(self, user=None):
        """True for backend/admin/staff users (anyone with access to the
        Odoo backend). Portal/candidate users are never part of this
        group, which is how we make sure admins never see, and can never
        use, the candidate portal or apply for a program themselves."""
        user = user or request.env.user
        return not user._is_public() and user.has_group('base.group_user')

    def _current_candidate_applications(self):
        """All applications (history + current) that belong to the
        logged in candidate, most recent first."""
        user = request.env.user
        if user._is_public() or self._is_internal_user(user):
            return request.env['odoocms.application']
        return request.env['odoocms.application'].sudo().search(
            [('user_id', '=', user.id)], order='application_date desc, id desc')

    def _get_current_application(self, application_id=None):
        """Resolve which application the current request should act on."""
        user = request.env.user
        Application = request.env['odoocms.application'].sudo()

        if user._is_public() or self._is_internal_user(user):
            return Application.browse()

        app_id = None
        if application_id:
            try:
                app_id = int(application_id)
            except (TypeError, ValueError):
                app_id = None
        if not app_id:
            app_id = request.session.get('active_application_id')

        application = Application.browse(app_id) if app_id else Application.browse()
        if not (application.exists() and application.user_id.id == user.id):
            # explicit/sessioned id was invalid, stale, or belonged to
            # someone else - fall back to the most recent own application
            application = Application.search(
                [('user_id', '=', user.id)], order='id desc', limit=1)

        if application:
            request.session['active_application_id'] = application.id
        return application

    def _open_registers_for_candidate(self):
        """Admission registers currently open for new applications, minus
        the ones the candidate already has a non-rejected application
        for (they should 'Continue'/view that one instead of starting a
        duplicate)."""
        user = request.env.user
        Register = request.env['odoocms.admission.register'].sudo()
        open_registers = Register.search([('state', '=', 'application')])

        applied_register_ids = self._current_candidate_applications().filtered(
            lambda a: a.state != 'reject').mapped('register_id').ids

        return open_registers.filtered(lambda r: r.id not in applied_register_ids)
