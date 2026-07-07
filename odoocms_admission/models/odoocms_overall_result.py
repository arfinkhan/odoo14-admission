from dateutil.relativedelta import relativedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError, Warning
import pdb

class OdooCMSOverallResult(models.Model):
    _name = "odoocms.overall.result"
    _description = "Admission Overall Result"

    cnic = fields.Char(string='CNIC', required=True)
    name = fields.Char(string='Name', required=True)
    session = fields.Char(string='Session', required=True)
    test_series = fields.Char(string='Test/Series Name', required=True)
    discipline = fields.Char(string='Discipline', required=True)
    total_score = fields.Integer(string='Total Score', required=True)



