

const express = require('express');// Import the express module יוצרים שרת express (מדמים שרת)(יוצרים שרת HTTP שאליו אנחנו יכולים לשלוח בקשות) 
const mongoose = require('mongoose');// Import the mongoose module //(שם פורמלי של  MONGODB) שמתחבר למסד נתונים של מונגו די בי
const cors = require('cors');// Import the cors module (מאפשר לנו לשלוט על מי יכול לגשת לשרת שלנו)(להעביר קריאות ממקום אחר .מאפשר לנו לשלוט על מי יכול לגשת לשרת שלנו)
const bodyParser = require('body-parser');// Import the body-parser module (מאפשר לנו לקרוא את גוף הבקשה שנשלחת לשרת שלנו) (מאפשר לנו לקרוא את הנתונים שנשלחים בבקשה)



const app = express();// Create an instance of express (יוצרים מופע של express) (מייצג את השרת שלנו)
// const port = 3000;// Define the port number (מגדירים את מספר הפורט שבו השרת שלנו יאזין לבקשות) (הפורט שבו השרת שלנו יאזין לבקשות)
// const dbUrl = 'mongodb://localhost:27017/mydatabase';// Define the database URL (מגדירים את כתובת ה-URL של מסד הנתונים שלנו) (הכתובת שבה נמצא מסד הנתונים שלנו)
// const dbOptions = { useNewUrlParser: true, useUnifiedTopology: true };// Define the database options (מגדירים את האפשרויות למסד הנתונים שלנו) (מאפשרים לנו להשתמש בגרסה החדשה של MONGODB)
app .use(cors());// Use the cors middleware (משתמשים במידלוור של cors) (מאפשר לנו לשלוט על מי יכול לגשת לשרת שלנו) (מאפשר לנו לשלוח בקשות ממקום אחר)
app.use(bodyParser.json());// Use the body-parser middleware (משתמשים במידלוור של body-parser) (מאפשר לנו לקרוא את גוף הבקשה שנשלחת לשרת שלנו)
// app.use(bodyParser.urlencoded({ extended: true }));// Use the body-parser middleware for URL-encoded data (משתמשים במידלוור של body-parser לנתונים מקודדים ב-URL) (מאפשר לנו לקרוא את הנתונים שנשלחים בבקשה)
// Connect to the MongoDB database (מתחברים למסד הנתונים של מונגו די בי)
mongoose.connect('mongodb+srv://mmoshem1995:3ONqJjN019zAncoe@cluster0.pninpzq.mongodb.net/Android2?retryWrites=true&w=majority&appName=Cluster0')// 
  .then(() => console.log('Connected to MongoDB'))// If the connection is successful, log a message to the console (אם החיבור מצליח, נרשום הודעה לקונסול)
  .catch(err => console.error('Error connecting to MongoDB:', err));// If the connection fails, log an error message to the console (אם החיבור נכשל, נרשום הודעת שגיאה לקונסול)

const userSchema = new mongoose.Schema({
    // Define the user schema (מגדירים את הסכמה של המשתמש) (מבנה הנתונים של המשתמש)
    first_name: { type: String, required: true }, // First name of the user (שם פרטי של המשתמש) (שדה חובה)
    last_name: { type: String, required: true }, // Last name of the user (שם משפחה של המשתמש) (שדה חובה)
    email: { type: String, required: true, unique: true }, // Email of the user (דוא"ל המשתמש) (שדה חובה וייחודי)
    password: { type: String, required: true }, // Password of the user (סיסמת המשתמש) (שדה חובה)
})

const User = mongoose.model('User', userSchema,'registerdUsers');// Create a model for the user schema (יוצרים מודל עבור הסכמה של המשתמש וניתן לעשות עליו עכשיו פעולות) (מודל שמייצג את המשתמש במסד הנתונים) under collection name 'users' and if i want to change the name of the collection i can do it like this: const User = mongoose.model('User', userSchema, 'users') and then the collection will be called users
app.post('/api/users', async (req, res) => {//post request to create a new user (בקשת POST ליצירת משתמש חדש).post is for transferring data to the server ang get is only for getting data from the server the
    const { command, data } = req.body;// Destructure the request body to get the command and data (מפרקים את גוף הבקשה כדי לקבל את הפקודה והנתונים) (גם יודעים מה הוא הcommand וגם יודעים מה הוא הdata)
    try {
        switch (command) {// Check the command and perform the corresponding action (בודקים את הפקודה ומבצעים את הפעולה המתאימה)
            
            case 'register': // If the command is 'register', create a new user (אם הפקודה היא 'register', יוצרים משתמש חדש)
                const existingUser = await User.findOne({ email: data.email });// Check if a user with the same email already exists (בודקים אם משתמש עם אותו דוא"ל כבר קיים)
                if (existingUser) {// If a user with the same email exists, return an error response (אם משתמש עם אותו דוא"ל קיים, מחזירים תגובה עם שגיאה)
                    return res.status(400).json({ message: 'User with  current email already exists' });// Return a 400 Bad Request response (מחזירים תגובה 400 בקשה לא חוקית)
                }
                const newUser = new User({ first_name: data.first_name, last_name: data.last_name, email: data.email, password: data.password });// Create a new user instance with the provided data (יוצרים מופע חדש של משתמש עם הנתונים שסופקו)
                await newUser.save();
                return res.json({ message: 'User created successfully :)', user: newUser });// Return a success response with the created user (מחזירים תגובה מוצלחת עם המשתמש שנוצר)
          
            case 'login': // If the command is 'login', authenticate the user (אם הפקודה היא 'login', מאמתים את המשתמש)
                const user = await User.findOne({ email: data.email, password: data.password });// Find the user with the provided email and password (מחפשים את המשתמש עם הדוא"ל והסיסמה שסופקו)
                if (!user) {// If the user is not found, return an error response (אם המשתמש לא נמצא, מחזירים תגובה עם שגיאה)
                    return res.status(401).json({ message: 'Invalid email or password' });// Return a 401 Unauthorized response (מחזירים תגובה 401 לא מורשה)
                }
                return res.json({ message: 'Login successful :)', user,answer:true });// Return a success response with the authenticated user (מחזירים תגובה מוצלחת עם המשתמש המאומת)
            default: // If the command is not recognized, return an error response (אם הפקודה לא מוכרת, מחזירים תגובה עם שגיאה)
                return res.status(400).json({ message: 'Invalid command' });// Return a 400 Bad Request response (מחזירים תגובה 400 בקשה לא חוקית)
            
        }
    } catch (error) {// If an error occurs, return an error response (אם מתרחשת שגיאה, מחזירים תגובה עם שגיאה)
        console.error('Error processing request:', error);// Log the error to the console (רושמים את השגיאה לקונסול)
        return res.status(500).json({ message: 'Internal server error' });// Return a 500 Internal Server Error response (מחזירים תגובה 500 שגיאה פנימית בשרת)
    }
});// Define the API endpoint for user operations (מגדירים את נקודת הקצה של ה-API לפעולות משתמשים)
// Start the server and listen for incoming requests (מתחילים את השרת ומאזינים לבקשות נכנסות)
const port = process.env.PORT || 5000;// Define the port number (מגדירים את מספר הפורט שבו השרת שלנו יאזין לבקשות) (אם לא מוגדר פורט בסביבת העבודה, נשתמש ב-3000)

app.listen(port, () => {// Start the server and listen on the specified port (מתחילים את השרת ומאזינים על הפורט המוגדר)
    console.log(`Server is running on port ${port}`);// Log a message to the console indicating that the server is running (רושמים הודעה לקונסול שהשרת פועל על הפורט המוגדר)
});// Start the server and listen for incoming requests (מתחילים את השרת ומאזינים לבקשות נכנסות)