# -*- coding: utf-8 -*-
"""Program / admission register application flow.

This is the ONLY place a new `odoocms.application` record gets created for
a logged-in candidate. A candidate signs up once (see account_registration
.py) and comes back here every time they want to apply for another open
program/register, reusing the same login.
"""
from odoo import http, _
from odoo.exceptions import UserError
from odoo.http import Controller, request, route

from .portal_common import PortalApplicationMixin


class ProgramRegisterApply(Controller, PortalApplicationMixin):

    @route(['/program/register/'], type='http', auth='user', website=True, sitemap=False)
    def program_register_list(self, **kw):
        """Lists the admission registers currently open for application,
        so a signed-in candidate can start a new application. Admin/
        backend users are redirected to the backend - they cannot apply
        for a program."""
        current_user = request.env.user
        if self._is_internal_user(current_user):
            return http.request.redirect('/web')

        open_registers = self._open_registers_for_candidate()
        context = {
            'company': request.env.company,
            'user': current_user,
            'open_registers': open_registers,
        }
        return request.render('odoocms_admission_portal.program_register_list', context)

    @route(['/program/register/apply'], type='http', method=['POST'], auth='user', website=True, csrf=True)
    def program_register_apply(self, **kw):
        """Creates (or resumes) an application for the candidate against
        the chosen register, then sends them into the multi-step
        application form for it."""
        current_user = request.env.user
        if self._is_internal_user(current_user):
            return http.request.redirect('/web')

        register_id = kw.get('register_id')
        if not register_id or not str(register_id).isdigit():
            raise UserError(_('Please choose a valid program/register to apply for.'))

        register = request.env['odoocms.admission.register'].sudo().browse(int(register_id))
        if not register.exists() or register.state != 'application':
            raise UserError(_('This program is not currently open for applications.'))

        Application = request.env['odoocms.application'].sudo()

        # a candidate should not end up with two applications for the
        # same register - resume the existing (non-rejected) one instead.
        existing = Application.search([
            ('user_id', '=', current_user.id),
            ('register_id', '=', register.id),
            ('state', '!=', 'reject'),
        ], limit=1)

        if existing:
            application = existing
        else:
            partner = current_user.partner_id
            name_parts = (partner.name or '').split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            application = Application.create({
                'register_id': register.id,
                'user_id': current_user.id,
                'email': current_user.email or current_user.login,
                'mobile': partner.mobile or partner.phone,
                'phone': partner.phone,
                'first_name': first_name,
                'last_name': last_name,
                'cnic': partner.cnic or False,
                'nationality': partner.country_id.id if partner.country_id else False,
                'gender': partner.gender or False,
                'applicant_type': 'national' if (partner.country_id and partner.country_id.id == 177) else 'international',
                'step_no': 1,
            })

        request.session['active_application_id'] = application.id
        return http.request.redirect('/admission/application/')
