import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';
export const handleUniversalLogin = async (req, res) => {
  const { data } = req.body;

  try {
    // First, check in Users collection

    const user = await User.findOne({ email:data.email});
    if (!user) {
      return res.json({ message: 'Invalid email or password', answer: false });
    }
    const isMach = await bcrypt.compare(data.password,user.password); 
    if (isMach) {
      return res.json({ message: 'login successful', userType: 'user', user,answer:true });
    }

    // If not found, check in Companies collection
    const company = await Company.findOne({ company_email: data.email, password:data.password });
    if (company) {
      return res.json({ message: 'login successful', userType: 'company', company, answer:true });
    }

    // If not found in either
    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error'});
  }
};
