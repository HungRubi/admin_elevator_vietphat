const fs = require('fs');
const path = require('path');

module.exports = {
    saveBase64Image(base64Data, prefix = 'image') {
        const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return null;
        }
    
        const imageBuffer = Buffer.from(matches[2], 'base64');
        const imageType = matches[1].split('/')[1];
        const fileName = `${prefix}_${Date.now()}.${imageType}`;
        const uploadDir = path.join(process.cwd(), 'uploads');
    
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
    
        const savePath = path.join(uploadDir, fileName);
        fs.writeFileSync(savePath, imageBuffer);
    
        return `/uploads/${fileName}`;
    }
}
