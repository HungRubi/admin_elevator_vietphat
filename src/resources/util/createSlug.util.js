const removeDiacritics = require('remove-diacritics');
module.exports = {
    createSlug: (text) => {
        // Loại bỏ dấu phụ và chuyển đổi thành chữ thường
        const cleanedText = removeDiacritics(text).toLowerCase();

        // Thay thế khoảng trắng và dấu câu bằng dấu gạch ngang
        return cleanedText
            .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự không phải chữ cái, số, khoảng trắng và dấu gạch ngang
            .trim() // Loại bỏ khoảng trắng đầu và cuối
            .replace(/\s+/g, '-') // Thay thế khoảng trắng liên tiếp bằng dấu gạch ngang
            .replace(/-+/g, '-') // Thay thế dấu gạch ngang liên tiếp bằng một dấu gạch ngang
            .replace(/^-+|-+$/g, ''); // Loại bỏ dấu gạch ngang đầu và cuối
    },
};
