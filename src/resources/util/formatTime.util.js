function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // tháng bắt đầu từ 0
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD
}

module.exports = {
    getTimeAgo(createdAt) {
        const now = new Date();
        const createdTime = new Date(createdAt);
        const diffInMs = now - createdTime;
        const diffInSeconds = Math.floor(diffInMs / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInMonths = Math.floor(diffInDays / 30);
        const diffInYears = Math.floor(diffInDays / 365);

        if (diffInMinutes < 3) {
            return "Vừa xong";
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} phút trước`;
        } else if (diffInHours < 24) {
            return `${diffInHours} giờ trước`;
        } else if (diffInDays < 7) {
            return `${diffInDays} ngày trước`;
        } else if (diffInWeeks < 5) {
            return `${diffInWeeks} tuần trước`;
        } else if (diffInMonths < 12) {
            return `${diffInMonths} tháng trước`;
        } else {
            return `${diffInYears} năm trước`;
        }
    },
    getToday () {
        const today = new Date();
        return formatDate(today);
    },
    getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return formatDate(yesterday);
    },
    getDateRange(type) {
        const date = new Date();
        
        if (type === "yesterday") {
            date.setDate(date.getDate() - 1);
        }
        
        // Lấy đầu ngày và cuối ngày
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        return {
            start: startOfDay,
            end: endOfDay
        };
    },
    getStartOfWeek() {
        const today = new Date();
        const day = today.getDay();
        const diff = day === 0 ? 6 : day - 1;
        today.setDate(today.getDate() - diff);
        return formatDate(today);
    },
    getEndOfWeek() {
        const today = new Date();
        const day = today.getDay();
        const diff = day === 0 ? 0 : 7 - day; // tiến tới Chủ nhật
        today.setDate(today.getDate() + diff);
        return formatDate(today);
    },
    getStartOfMonth() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1); // ngày đầu tháng
        return formatDate(firstDay);
    },

    getEndOfMonth() {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // ngày 0 của tháng sau = ngày cuối tháng
        return formatDate(lastDay);
    },
    getStartOfYear() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        return formatDate(firstDay);
    },
    getEndOfYear() {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), 11, 31); // 31/12
        return formatDate(lastDay);
    }
}

