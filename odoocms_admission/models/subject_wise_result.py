from dateutil.relativedelta import relativedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError, Warning
import pdb



class OdooCMSAdmissionSubjectWiseResult(models.Model):
    _name = "odoocms.admission.subject.result"
    _description = "Admission Subject Result"

    name = fields.Char(string='Subject Name', required=True)
    score = fields.Integer(string='Score', required=True)
    cnic = fields.Char(string='CNIC', required=True)
    total_score = fields.Integer(string='Total Score', required=True)



