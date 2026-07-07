from odoo import api, fields, models, _

class ResPartner(models.Model):
	_inherit = 'res.partner'

	cnic = fields.Char( string='CNIC')
	gender = fields.Selection([('m', 'Male'), ('f', 'Female'), ('o', 'Other')], string='Gender')


class ResCompany(models.Model):
	_inherit = "res.company"

	short_name = fields.Char('Short Name')


class ResUsers(models.Model):
	_inherit = 'res.users'

	# A candidate signs up once and can apply to multiple
	# programs/registers over time - this exposes that full history
	# directly off their account (used by the portal dashboard).
	application_ids = fields.One2many(
		'odoocms.application', 'user_id', string='Admission Applications')
	application_count = fields.Integer(
		'Admission Applications Count', compute='_compute_application_count')

	def _compute_application_count(self):
		for user in self:
			user.application_count = len(user.application_ids)