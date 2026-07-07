# -*- coding: utf-8 -*-
from odoo import models, fields, api


class OdooCMSBank(models.Model):
    _name = "odoocms.bank"
    _description = "Admission Bank Account"
    _rec_name = 'name'

    name = fields.Char('Bank Name', required=True)
    account_title = fields.Char('Account Title', required=True)
    account_no = fields.Char('Account Number', required=True)
    iban_no = fields.Char('IBAN Number')
    branch = fields.Char('Branch')
    active = fields.Boolean('Active', default=True)

    _sql_constraints = [
        ('account_no_uniq', 'unique(account_no)', 'This account number is already registered for another bank.'),
    ]

    def name_get(self):
        result = []
        for rec in self:
            label = rec.name
            if rec.account_no:
                label = '%s - %s' % (rec.name, rec.account_no)
            result.append((rec.id, label))
        return result
