# -*- coding: utf-8 -*-
"""Candidate identity (signup/signin) for the admission portal.

Redesigned so that a candidate signs up ONCE for a permanent account
(login = their email address) and reuses those same credentials to apply
to as many programs/registers as they like via /program/register/.
No `odoocms.application` record is created at signup time anymore - that
now only happens when the candidate explicitly applies for a program
(see controllers/program_register.py).
"""
import logging

import odoo
import odoo.addons.web.controllers.main as main
import werkzeug
from odoo import _, http
from odoo.addons.auth_signup.models.res_users import SignupError
from odoo.exceptions import UserError
from odoo.addons.web.controllers.main import Home
from odoo.http import Controller, request, route

from .portal_common import PortalApplicationMixin

_logger = logging.getLogger(__name__)


class AccountRegistration(Controller):

    @route(['/web/signin/'], method='GET', type='http', auth="public", sitemap=False)
    def index_signin(self, redirect=None, **kw):
        country_id = request.env['res.country'].sudo().search([])
        values = {
            'country_id': country_id,
            'company': request.env.company,
        }
        return request.render('odoocms_admission_portal.account_registration', values)


class AdmissionSignUp(Home, PortalApplicationMixin):

    @http.route('/web/admission/signup/', type='http', csrf=False, auth='public', website=True, sitemap=False)
    def web_auth_admission_signup(self, *args, **kw):
        """Create a candidate's one-time-for-life account.

        This ONLY creates the res.users/res.partner identity. The login
        is an auto-generated numeric ID (not the email), assigned once
        here and reused for every application that candidate ever makes.
        Applying for a specific program is a separate, later step done
        from the dashboard once signed in.
        """
        qcontext = self.get_auth_signup_qcontext()
        if not qcontext.get('token') and not qcontext.get('signup_enabled'):
            raise werkzeug.exceptions.NotFound()

        if 'error' not in qcontext and request.httprequest.method == 'POST':
            try:
                country_id = request.env['res.country'].sudo().search([])
                qcontext.update({
                    'country_id': country_id,
                    'company': request.env.company,
                })

                email = (kw.get('email') or '').strip().lower()
                if not email:
                    raise UserError(_('Email is required to sign up.'))

                existing_user = request.env['res.users'].sudo().search(
                    ['|', ('email', '=', email), ('login', '=', email)], limit=1)
                if existing_user:
                    raise UserError(_('An account already exists for this email. Please sign in instead.'))

                country = int(kw.get('country_id_signup')) if kw.get('country_id_signup', '').isnumeric() else 177
                cnic = kw.get('cnic', '').replace('-', '') or False

                # Login: auto-generated numeric ID, assigned once at
                # signup and reused for life across every application.
                login_no = request.env['ir.sequence'].sudo().next_by_code('admission.candidate.login')
                if not login_no:
                    raise UserError(_('Could not generate a login ID, please try again.'))

                # Password policy (per business rule):
                #   - Pakistani applicants (country == 177): CNIC digits,
                #     no dashes, as the password.
                #   - International applicants (no CNIC): the email's
                #     local part (before '@') merged with the login ID,
                #     e.g. amjad@gmail.com + login 22234 -> "amjad@22234".
                if country == 177:
                    if not cnic or not cnic.isnumeric():
                        raise UserError(_('CNIC is required for Pakistani applicants.'))
                    password = cnic
                else:
                    password = '%s@%s' % (email.split('@')[0], login_no)
                if not password:
                    password = 'nutech1234'
                confirm_password = password

                name = '%s %s' % (kw.get('first_name', '').strip(), kw.get('last_name', '').strip())

                qcontext.update({
                    'login': login_no,
                    'email': email,
                    'name': name.strip(),
                    'password': password,
                    'confirm_password': confirm_password,
                    'phone': kw.get('phone'),
                    'country_id': country_id,
                })
                kw.update(qcontext)

                self.admission_signup(qcontext)

                user = request.env['res.users'].sudo().search([('login', '=', login_no)], limit=1)
                if not user:
                    raise UserError(_('Could not create your account, please try again.'))

                # keep the extra candidate details (cnic / nationality /
                # gender / phone) on the partner - the permanent identity
                # a candidate carries across every application they make.
                user.partner_id.sudo().write({
                    'cnic': cnic,
                    'phone': kw.get('phone'),
                    'mobile': kw.get('phone'),
                    'country_id': country,
                    'gender': kw.get('gender') or False,
                })

                template = request.env.ref('odoocms_admission.mail_template_account_created', raise_if_not_found=False)
                if template:
                    login_value = {
                        'email': email,
                        'company_name': request.env.company.name or "",
                        'company_website': request.env.company.website or "",
                        'company_email': request.env.company.admission_mail or "",
                        'company_phone': request.env.company.admission_phone or "",
                        'login': login_no,
                        'password': password,
                    }
                    template.sudo().with_context(login_value).send_mail(user.id, force_send=False)

                # Login/password weren't chosen by the candidate (both are
                # auto-generated), so show them once here in addition to
                # emailing them, then let the candidate sign in normally.
                success_context = {
                    'country_id': country_id,
                    'company': request.env.company,
                    'message': _(
                        'Account created successfully. Your Login ID is: %(login)s. '
                        'Your password is: %(password)s (also emailed to you). '
                        'Please save both - you will need them to sign in and apply for programs.'
                    ) % {'login': login_no, 'password': password},
                }
                response = request.render('odoocms_admission_portal.account_registration', success_context)
                response.headers['X-Frame-Options'] = 'DENY'
                return response

            except UserError as e:
                qcontext['error'] = e.name or e.value
            except (SignupError, AssertionError) as e:
                if request.env["res.users"].sudo().search([("login", "=", qcontext.get("login"))]):
                    qcontext["error"] = _("Another user is already registered using this email address.")
                else:
                    _logger.error("%s", e)
                    qcontext['error'] = _("Could not create a new account.")

        response = request.render('odoocms_admission_portal.account_registration', qcontext)
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    def admission_signup(self, qcontext):
        if not qcontext.get('token'):
            # our custom function should not be called if user go for reset password. So, we have added this statement
            # """ Shared helper that creates a res.partner out of a token """
            values = {key: qcontext.get(key) for key in ('login', 'name', 'password', 'email', 'phone')}
            if not values:
                raise UserError(_("The form was not properly filled in."))
            if request.env["res.users"].sudo().search([('login', '=', qcontext.get('login'))]):
                raise UserError(_("Another user is already registered with the same email."))
            if values.get('password') != qcontext.get('confirm_password'):
                raise UserError(_("Passwords do not match; please retype them."))
            self._signup_with_values(qcontext.get('token'), values)
            request.env.cr.commit()
        else:
            # token branch (e.g. reset password) - fall through to Odoo's
            # standard auth_signup handling.
            self.do_signup(qcontext)

    @http.route('/web/login/admission/', type='http', csrf=False, auth="public", sitemap=False)
    def web_login_admission(self, redirect=None, **kw):
        main.ensure_db()
        request.params['login_success'] = False
        if request.httprequest.method == 'GET' and redirect and request.session.uid:
            return http.redirect_with_hash(redirect)

        if not request.uid:
            request.uid = odoo.SUPERUSER_ID

        values = request.params.copy()
        country_id = request.env['res.country'].sudo().search([])
        values.update({'country_id': country_id})
        try:
            values['databases'] = http.db_list()
        except odoo.exceptions.AccessDenied:
            values['databases'] = None

        if request.httprequest.method == 'POST':
            old_uid = request.uid
            try:
                uid = request.session.authenticate(
                    request.session.db, kw['login'], str(kw['password']).strip())
                request.params['login_success'] = True
                current_user = request.env['res.users'].browse(uid)

                # Backend/admin/staff users keep using the normal Odoo
                # backend exactly as before - they never see the
                # candidate portal dashboard and can't apply for a
                # program themselves.
                if self._is_internal_user(current_user):
                    return http.redirect_with_hash(self._login_redirect(uid, redirect=redirect))

                # Candidates always land on their dashboard, which shows
                # their full application history/status plus any
                # programs currently open for a new application.
                return http.local_redirect('/admission/dashboard/')

            except odoo.exceptions.AccessDenied as e:
                country_id = request.env['res.country'].sudo().search([])
                values.update({
                    'country_id': country_id,
                    'company': request.env.company,
                })
                request.uid = old_uid
                if e.args == odoo.exceptions.AccessDenied().args:
                    values['error'] = _("Wrong login/password")
                else:
                    values['error'] = e.args[0]
        else:
            if 'error' in request.params and request.params.get('error') == 'access':
                values['error'] = _('Only employee can access this database. Please contact the administrator.')

        if 'login' not in values and request.session.get('auth_login'):
            values['login'] = request.session.get('auth_login')

        if not odoo.tools.config['list_db']:
            values['disable_database_manager'] = True

        if 'debug' in values:
            values['debug'] = True

        response = request.render('odoocms_admission_portal.account_registration', values)
        response.headers['X-Frame-Options'] = 'DENY'

        if not redirect and request.params['login_success']:
            if request.env['res.users'].browse(request.uid).has_group('base.group_user'):
                redirect = b'/web?' + request.httprequest.query_string
            else:
                redirect = '/admission/dashboard/'
            return http.redirect_with_hash(redirect)

        response.qcontext.update(self.get_auth_signup_config())
        if request.httprequest.method == 'GET' and request.session.uid and request.params.get('redirect'):
            return http.redirect_with_hash(request.params.get('redirect'))

        return response
