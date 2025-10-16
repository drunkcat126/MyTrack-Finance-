📊 MyTrack: Personal Finance Tracker

MyTrack is a personal finance tracker web application designed to help users monitor their income, expenses, and financial goals with an intuitive interface and informative data visualization. Built using **pure HTML, CSS, and JavaScript** (Vanilla JS) along with Chart.js for data visualization, MyTrack offers a *lightweight* and *responsive* solution for daily financial management.

✨ Key Features

MyTrack is equipped with a full suite of features for effective financial management:

1. Concise and Informative Dashboard

  * **Financial Summary**: Displays the **Total Balance**, **Total Income**, and **Total Expense** in *real-time* using easily digestible cards.
  * **Recent Transactions**: Shows the **5 most recent transactions** to quickly monitor current activity.
  * **Interactive Monthly Chart**: Data visualization using **Chart.js** displays a comparison between monthly income and expenses throughout the year (Bar Chart).
  * **Smart Recommendations**: Provides **personalized financial advice** based on savings rate, dominant expense categories, and milestone progress.

2. Core Data Management

  * **Transaction Management**:
      * **Add/Edit/Delete Transactions**: Users can record Income or Expense transactions, complete with amount, date, category, and description.
      * **Comprehensive Transaction Table**: Presents a detailed list of transactions, sorted by the latest date.
  * **Category Management**:
      * Users can add new categories for both Income (e.g., Salary, Bonus) and Expense (e.g., Food, Entertainment).
      * Includes **validation** to prevent the deletion of categories already used in transactions, ensuring data integrity.
  * **Financial Goals (Milestones)**:
      * **Goal Setting**: Allows users to set specific savings goals (e.g., Buy a Motorbike, Vacation) with a target amount and date.
      * **Progress Tracking**: Automatically calculates and displays the **progress percentage (%)** toward the goal based on the current balance, visualized with a dynamic *progress bar*.

3. Reports and In-Depth Analysis

  * **Report Types**: Users can select **Monthly (Line Chart)** or **Category-Based (Pie Chart)** reports.
  * **Report Visualization**: Presents detailed charts:
      * Monthly Report uses a **Line Chart** to view trends over time.
      * Category Report uses a **Pie Chart** to visualize the proportional allocation of funds.
  * **Report Summary**: Provides a detailed text summary alongside the chart, including totals, net income, and the months/categories with the highest expense/income.
  * **PDF Export Functionality**: Allows users to **export the report (chart and summary)** into a PDF format using **jsPDF**, ideal for documentation or sharing.

4. User Experience (UX)

  * **Dark/Light Mode Support**: Features a *theme switcher* to toggle between **Light Mode** and **Dark Mode** for visual comfort. The theme preference is stored in *Local Storage*.
  * **Local Storage**: All data (transactions, categories, milestones) are stored in the browser's **Local Storage**, ensuring data persistence even after closing the application.
  * **Responsive Design**: The interface is optimized for desktop, tablet, and mobile viewing.

🛠️ Tech Stack

  * **Front-end**: HTML5, CSS3, JavaScript (Vanilla JS)
  * **Visualization**: [Chart.js](https://www.chartjs.org/)
  * **Document Export**: [jsPDF](https://www.google.com/search?q=https://raw.githack.com/MrRio/jsPDF/master/docs/) (Note: Based on your `script.js` code, only the core `jspdf` library is used for image and text, `jspdf-autotable` is included in `index.html` but not explicitly used in the export logic)
  * **Icons**: [Font Awesome](https://fontawesome.com/)
