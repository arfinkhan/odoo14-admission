# -*- coding: utf-8 -*-
from odoo.http import route, request, Controller
import json
from odoo.tools.translate import _
import base64

from .portal_common import PortalApplicationMixin


class DashboardStudentAdmission(Controller, PortalApplicationMixin):

    @route(['/admission/dashboard/', '/admission/applicant/dashboard'], method='GET', type='http', auth="user", website=True)
    def admission_applicant_dashboard(self, **kw):
        """The candidate's home base: their full application history +
        current status, plus any programs currently open that they can
        apply for. Backend/admin users are never shown this page - they
        keep using the regular Odoo backend."""
        current_user = request.env.user
        if self._is_internal_user(current_user):
            return request.redirect('/web')

        company = request.env.company
        applications = self._current_candidate_applications()
        open_registers = self._open_registers_for_candidate()

        context = {
            'company': company,
            'user': current_user,
            'partner': current_user.partner_id,
            'applications': applications,
            'open_registers': open_registers,
        }
        return request.render('odoocms_admission_portal.admission_student_dashboard', context)

    @route(['/admission/eligibility/download'], type='http', auth="user", website=True, csrf=False)
    def eligibilti_admission(self, m='', f='', id=0, **kw):
        application_id = self._get_current_application(kw.get('application_id'))
        m = 'odoocms.admission.register'
        f = 'eligibility_criteria_image'

        record = request.env[str(m)].sudo().search([('id', '=', int(application_id.register_id.id))])
        status, content, filename, mimetype, filehash = request.env['ir.http'].sudo()._binary_record_content(record,
                                                                                                     field=str(f))
        status, headers, content = request.env['ir.http'].sudo()._binary_set_headers(status, content, filename, mimetype,
                                                                             unique=False, filehash=filehash,
                                                                             download=True)
        if status != 200:
            return request.env['ir.http'].sudo()._response_by_status(status, headers, content)
        else:
            content_base64 = base64.b64decode(content)
            headers.append(('Content-Length', len(content_base64)))
            response = request.make_response(content_base64, headers)
        return response

    @route(['/program/transfer/'], method='GET', csrf=False, type='http', auth="user")
    def program_transfer_request(self, **kw):
        application_id = self._get_current_application(kw.get('application_id'))
        try:
            program_transfer_from = kw.get('program_transfer_from')
            program_transfer_to = kw.get('program_transfer_to')

            pending_request = request.env['odoocms.program.transfer.request'].sudo().search(
                [('applicant_id', '=', application_id.id)])
            if not pending_request:
                program_transfer_request = request.env['odoocms.program.transfer.request'].sudo().create({
                    'applicant_id': application_id.id,
                    'current_program': program_transfer_to,
                    'previous_program': program_transfer_from,
                    'pre_test_marks': kw.get('pre_test_marks'),
                })
            if pending_request:
                if pending_request.state == 'draft':
                    pending_request.unlink()
                    program_transfer_request = request.env['odoocms.program.transfer.request'].sudo().create({
                        'applicant_id': application_id.id,
                        'pre_test_marks': kw.get('pre_test_marks'),
                        'current_program': program_transfer_from,
                        'previous_program': program_transfer_to,
                    })

            return json.dumps({
                'status': 'noerror',
            })

        except Exception as e:
            return json.dumps({
                'msg': f'{e}',
                'application_state': application_id.state,
                'status': 'error',
            })
