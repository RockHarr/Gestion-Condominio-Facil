import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Expense, PaymentRecord } from '../types';

interface FinancialChartsProps {
    expenses: Expense[];
    payments: PaymentRecord[];
    theme: 'light' | 'dark';
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ expenses, payments, theme }) => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';

    // --- Pie Chart Logic (Expenses by Category) ---
    const expensesByCategory = expenses.reduce((acc, expense) => {
        const cat = expense.categoria || 'Otros';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += expense.monto;
        return acc;
    }, {} as Record<string, number>);

    let pieData = Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Group small items into "Otros" if too many
    if (pieData.length > 6) {
        const top5 = pieData.slice(0, 5);
        const others = pieData.slice(5).reduce((sum, item) => sum + item.value, 0);
        pieData = [...top5, { name: 'Otros', value: others }];
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

    // --- Bar Chart Logic (Income vs Expenses - Last 6 Months) ---
    const getLast6Months = () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toISOString().slice(0, 7)); // YYYY-MM
        }
        return months;
    };

    const last6Months = getLast6Months();
    const barData = last6Months.map(month => {
        const monthName = new Date(month + '-01').toLocaleString('es-CL', { month: 'short' });

        // Income (Caja) - Payments received in this month
        const income = payments
            .filter(p => p.fechaPago.startsWith(month))
            .reduce((sum, p) => sum + p.monto, 0);

        // Expenses (Devengado) - Expenses approved for this month
        const expense = expenses
            .filter(e => e.fecha.startsWith(month))
            .reduce((sum, e) => sum + e.monto, 0);

        return {
            name: monthName,
            Ingresos: income,
            Gastos: expense
        };
    });

    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Gastos por Categoría</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                                contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', color: textColor }}
                                itemStyle={{ color: textColor }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ingresos vs Gastos</h3>
                    <div className="group relative">
                        <span className="cursor-help text-gray-400">ⓘ</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg hidden group-hover:block z-10">
                            <strong>Ingresos (Caja):</strong> Pagos reales recibidos.<br />
                            <strong>Gastos (Devengado):</strong> Gastos aprobados del mes.
                        </div>
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" stroke={textColor} fontSize={12} />
                            <YAxis stroke={textColor} fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                            <Tooltip
                                formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                                contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb', color: textColor }}
                                itemStyle={{ color: textColor }}
                            />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
