import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const filePath = path.join(__dirname, '../data/filterOptions.json');

// קריאה לקובץ
export const getFilterOptions = async (req, res) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const filterOptions = JSON.parse(data);
    res.json(filterOptions);
  } catch (error) {
    console.error("Error reading filter options:", error);
    res.status(500).json({ error: "Failed to load filter options" });
  }
};

// הוספת ערך חדש (אם לא קיים כבר)
export const addFilterValue = async (req, res) => {
  const { category, value } = req.body;

  if (!value || !value.trim()) {
    return res.status(400).json({ error: "Value is empty or invalid" });
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const filterOptions = JSON.parse(data);


    if (!filterOptions[category]) {
      filterOptions[category] = [];
    }

    // הוספה רק אם לא קיים כבר
    if (!filterOptions[category].includes(value)) {
      filterOptions[category].push(value);

      fs.writeFileSync(filePath, JSON.stringify(filterOptions, null, 2), 'utf-8');
      return res.json({ success: true, updated: true });
    } else {
      return res.json({ success: true, updated: false, message: "Value already exists" });
    }

  } catch (error) {
    console.error("Error updating filter options:", error);
    res.status(500).json({ error: "Failed to update filter options" });
  }
};
