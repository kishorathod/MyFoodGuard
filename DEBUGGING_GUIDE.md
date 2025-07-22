# Debugging Guide: Food Item Saving Issue

## 🔍 **Issue Description**
Users are experiencing "Failed to add item. Please try again." error when trying to save food items.

## 🛠️ **Recent Fixes Applied**

### ✅ **Fixed Issues**
1. **Data Type Conversion**: Fixed quantity and price conversion from strings to numbers
2. **Validation Schema**: Updated to accept all frontend category and unit values
3. **Date Handling**: Improved expiry date validation and formatting
4. **Error Handling**: Enhanced error messages and logging
5. **Database Model**: Fixed minimum quantity validation (0.1 instead of 0)
6. **Frontend Logging**: Added detailed console logging for debugging

## 🚀 **Quick Test Steps**

### 1. **Test Backend Connection**
Visit: `http://localhost:5000/api/food/test`
Expected: `{"success": true, "message": "Test successful"}`

### 2. **Test Database Connection**
Visit: `http://localhost:5000/api/food/test-db` (requires authentication)
Expected: `{"success": true, "message": "Database connection successful!"}`

### 3. **Check Browser Console**
Open browser DevTools → Console and look for:
```
🔍 Frontend - Adding item with data: {...}
🔍 Frontend - Token exists: true
🔍 Frontend - Response status: 201
🔍 Frontend - Item added successfully: {...}
```

### 4. **Check Backend Console**
Look for these log messages:
```
🔍 Add Food Item - Request Body: {...}
🔍 Add Food Item - User ID: ...
🔍 Add Food Item - Processed Data: {...}
🔍 Add Food Item - Item Saved: ...
```

## 🔧 **Common Issues and Solutions**

### **Issue 1: Data Type Mismatch**
**Symptoms**: Validation errors about quantity or price
**Solution**: ✅ Fixed - Backend now converts strings to numbers

### **Issue 2: Category/Unit Validation**
**Symptoms**: "Category is required" or "Unit is required" errors
**Solution**: ✅ Fixed - Updated validation to accept all frontend values

### **Issue 3: Database Connection**
**Symptoms**: "MongoDB connection error"
**Solution**: 
1. Start MongoDB: `mongod`
2. Check connection string in `.env`
3. Test with: `http://localhost:5000/api/food/test-db`

### **Issue 4: Authentication Issues**
**Symptoms**: "Unauthorized" errors
**Solution**:
1. Check if user is logged in
2. Verify JWT token is valid
3. Clear localStorage and log in again

### **Issue 5: AI Model Connection**
**Symptoms**: "AI Error" in logs
**Solution**: 
1. Start AI model: `cd ai-model && python app.py`
2. This is optional - items will still save without AI

## 🛠️ **Advanced Debugging**

### **Use the Debug Script**
```bash
# Install node-fetch if needed
npm install node-fetch

# Run the debug script
node debug-food-item.js <YOUR_JWT_TOKEN>
```

### **Manual API Testing**
```bash
curl -X POST http://localhost:5000/api/food \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Apple",
    "quantity": 1,
    "unit": "units",
    "expiryDate": "2024-01-15",
    "category": "fruits"
  }'
```

### **Check Database Directly**
```bash
# Connect to MongoDB
mongosh

# Check the database
use food-waste-tracker
db.fooditems.find().pretty()
```

## 📊 **Expected Data Flow**

### **Frontend → Backend**
```json
{
  "name": "Test Apple",
  "description": "",
  "category": "fruits",
  "quantity": 1,
  "unit": "units",
  "expiryDate": "2024-01-15",
  "price": "",
  "storageLocation": "fridge",
  "notes": ""
}
```

### **Backend Processing**
1. ✅ Convert quantity to number: `1`
2. ✅ Convert price to number: `0` (if empty)
3. ✅ Convert expiryDate to Date object
4. ✅ Validate all fields
5. ✅ Save to database
6. ✅ Return success response

### **Backend → Frontend**
```json
{
  "success": true,
  "message": "Food item created successfully",
  "data": {
    "_id": "...",
    "name": "Test Apple",
    "quantity": 1,
    "unit": "units",
    "expiryDate": "2024-01-15T00:00:00.000Z",
    "category": "fruits",
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## 🎯 **Troubleshooting Checklist**

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] MongoDB is running (`mongod`)
- [ ] Frontend is running (`npm run dev` in frontend folder)
- [ ] User is logged in (check localStorage for token)
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows successful POST request
- [ ] Backend console shows detailed logs
- [ ] Database contains the new item

## 🚨 **If Still Not Working**

1. **Check Backend Logs**: Look for detailed error messages
2. **Check Frontend Console**: Look for network errors
3. **Test with Debug Script**: Use the provided debug script
4. **Check Database**: Verify MongoDB is running and accessible
5. **Restart Services**: Stop and restart all services
6. **Clear Browser Data**: Clear localStorage and log in again

## 📞 **Get Help**

If the issue persists:
1. Run the debug script and share the output
2. Share backend console logs
3. Share browser console logs
4. Share network tab details
5. Note the exact steps to reproduce

## 🎯 **Quick Test**

Try adding this minimal item in the frontend:
- **Name**: Test Apple
- **Quantity**: 1
- **Unit**: units
- **Expiry Date**: 2024-01-15
- **Category**: fruits

If this works, the issue is with specific form data. If it doesn't, there's a broader system issue. 