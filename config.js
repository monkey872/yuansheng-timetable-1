/**
 * 元生國民小學｜課表查詢系統設定
 * 115學年度第1學期
 */
const CONFIG = {
    SEMESTERS: {
        '115學年度第1學期': './timetable_115-1.csv'
    },

    // 靜態網站上的簡易登入；若公開給家長查詢，可直接使用訪客登入。
    USERNAME: 'teacher',
    PASSWORD: 'yuansheng115',

    SCHOOL_NAME: '桃園市中壢區元生國民小學',
    SCHOOL_SUBTITLE: '115學年度第1學期課表查詢系統',

    // PDF 課表實際提供第1～7節；第8節目前無課程資料。
    PERIOD_TIMES: [
        { start: '——', end: '——', label: '早自習' },
        { start: '08:40', end: '09:20' },
        { start: '09:30', end: '10:10' },
        { start: '10:25', end: '11:05' },
        { start: '11:15', end: '11:55' },
        { start: '13:10', end: '13:50' },
        { start: '14:10', end: '14:50' },
        { start: '15:00', end: '15:40' },
        { start: '——', end: '——' }
    ]
};
