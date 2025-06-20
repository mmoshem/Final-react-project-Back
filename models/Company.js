// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    company_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Company = mongoose.model('Company', companySchema,'registerdCompanies');

// module.exports = User;
export default Company;