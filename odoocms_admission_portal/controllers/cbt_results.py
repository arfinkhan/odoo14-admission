# -*- coding: utf-8 -*-
from odoo.http import route, request, Controller
import json

from .portal_common import PortalApplicationMixin


class DashboardApplicantAdmission(Controller, PortalApplicationMixin):

    @route(['/admission/applicant/cbt/result'], method='GET', type='http', auth="user")
    def admission_applicant_cbt_results(self, **kw):
        company = request.env.company
        user = request.env.user
        application_id = self._get_current_application(kw.get('application_id'))

        cbt_results = request.env['odoocms.overall.result'].sudo().search(
            [('cnic', "=", application_id.cnic)])

        context = {
            'cbt_result': cbt_results,
            'company': company,
            'user': user,
            'application_id': application_id,
        }
        return request.render('odoocms_admission_portal.cbt_results', context)
