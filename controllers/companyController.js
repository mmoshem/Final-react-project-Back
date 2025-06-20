import Company from "../models/Company.js";

export const handleCompanyCommand = async (req, res) => {
  const { command, data } = req.body;

  try {
    switch (command) {
      case "register":
        const existingCompany = await Company.findOne({
          company_email: data.email,
        });
        if (existingCompany) {
          return res
            .status(400)
            .json({ message: "Company with current email already exists" });
        }
        const newCompany = new Company({
          company_name: data.company_name,
          company_email: data.email,
          password: data.password,
        });
        await newCompany.save();
        return res.json({
          message: "Company created successfully",
          company: newCompany,
        });

      case "login":
        const company = await Company.findOne({
          company_email: data.email,
          password: data.password,
        });
        if (!company) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        return res.json({ message: "Login successful",type:"company" ,company, answer: true });

      default:
        return res.status(400).json({ message: "Invalid command" });
    }
  } catch (error) {
    console.error("Error processing company request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
