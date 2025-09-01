# File & Photo Sharing Guide 📎📸

## 🎉 **New Features Added!**

Your SMS dashboard now supports **file and photo sharing** in conversations, just like professional messaging apps!

## 📋 **What You Can Send:**

### **📸 Photos & Images:**
- JPEG, PNG, GIF, WebP
- Any image format supported by browsers
- Automatic image preview in conversation

### **📄 Documents:**
- PDF files
- Word documents (.doc, .docx)
- Excel spreadsheets (.xls, .xlsx)
- Text files (.txt)
- CSV files
- Compressed files (.zip, .rar)

## 🚀 **How to Use:**

### **1. Open a Conversation:**
1. Go to **"Sent Messages"** section
2. Click **"View Chat"** next to any contact
3. The conversation modal will open

### **2. Attach a File:**
1. **For Documents:** Click the 📎 **paperclip** button
2. **For Photos:** Click the 🖼️ **image** button
3. Select your file from the file picker
4. You'll see a preview of the file with:
   - File name
   - File size
   - Image thumbnail (for photos)
   - File icon (for documents)

### **3. Send with Message:**
- Type an optional message
- Click **"Send"** button
- The file will be sent as MMS (Multimedia Message)

### **4. Send File Only:**
- Leave the message field empty
- Just attach the file and click **"Send"**
- The file will be sent with a default attachment indicator

## 🎯 **Features:**

✅ **File Preview** - See what you're sending before it goes  
✅ **Image Thumbnails** - Photos show as small previews  
✅ **File Size Display** - Know how big your files are  
✅ **Easy Removal** - Click "Remove" to cancel attachment  
✅ **Multiple Formats** - Support for images, documents, and more  
✅ **Professional UI** - Clean, modern interface  
✅ **MMS Support** - Uses Telnyx MMS API for reliable delivery  

## 📱 **In Conversation View:**

### **Sending Files:**
- Files appear with a 📎 attachment indicator
- Message bubbles show file information
- Clean, organized layout

### **File Types Supported:**
- **Images:** JPEG, PNG, GIF, WebP, BMP, TIFF
- **Documents:** PDF, DOC, DOCX, TXT, CSV, XLS, XLSX
- **Archives:** ZIP, RAR, 7Z
- **And more!**

## 🔧 **Technical Details:**

### **Backend Integration:**
- Uses existing `/api/send-mms` endpoint
- Handles file uploads with `multer`
- Supports multipart/form-data
- Automatic file type detection

### **Frontend Features:**
- File input handling
- Image preview generation
- File size calculation
- Drag & drop ready (future enhancement)

## 🚨 **Limitations & Notes:**

### **File Size Limits:**
- **Telnyx MMS Limit:** 5MB per message
- **Recommended:** Keep files under 2MB for best delivery
- **Large files:** May take longer to send

### **Supported Carriers:**
- Most US carriers support MMS
- International delivery varies by carrier
- Some carriers may convert to links

### **File Types:**
- Images are sent as-is
- Documents may be converted to links by some carriers
- PDFs are generally well-supported

## 🎯 **Best Practices:**

1. **Image Optimization:**
   - Compress images before sending
   - Use JPEG for photos, PNG for graphics
   - Keep under 1MB for fast delivery

2. **Document Sharing:**
   - PDFs work best across all carriers
   - Consider converting large documents to PDF
   - Include descriptive messages with documents

3. **File Naming:**
   - Use descriptive file names
   - Avoid special characters
   - Keep names under 50 characters

## 🧪 **Testing Your Setup:**

### **Test File Sending:**
1. Open a conversation
2. Attach a small image (< 1MB)
3. Send with a message
4. Check delivery status

### **Test Document Sending:**
1. Attach a PDF file
2. Send without message
3. Verify recipient receives it

### **Troubleshooting:**
- **File too large:** Compress or resize
- **Not sending:** Check file format
- **Delivery issues:** Verify carrier MMS support

## 🎉 **What's Next:**

Your messaging platform now rivals professional SMS apps with:
- ✅ Text messaging
- ✅ File sharing
- ✅ Photo sharing
- ✅ Conversation view
- ✅ Contact management
- ✅ Voice calls
- ✅ 24/7 cloud hosting

**You can now send files and photos just like WhatsApp, Telegram, or any modern messaging app!** 🚀 