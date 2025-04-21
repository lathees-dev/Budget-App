"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: string;
  name: string;
  budget: number;
  color: string;
}

interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isYearly, setIsYearly] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  // Removed unused isLoading state
  const [error, setError] = useState("");

  const [newCategory, setNewCategory] = useState({
    name: "",
    budget: 0,
    color: "#0088FE",
  });

  const [newTransaction, setNewTransaction] = useState({
    categoryId: "",
    amount: 0,
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null
  );

  const { user, logout } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Removed isLoading setter
      try {
        // Fetch categories
        const categoriesRes = await fetch("/api/categories");
        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
        const categoriesData = await categoriesRes.json();

        // Fetch transactions
        const transactionsRes = await fetch("/api/transactions");
        if (!transactionsRes.ok)
          throw new Error("Failed to fetch transactions");
        const transactionsData = await transactionsRes.json();

        setCategories(categoriesData);
        setTransactions(transactionsData);
        setError("");
      } catch (err) {
        setError("Error loading data. Please try again.");
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const handleAddCategory = async () => {
    if (newCategory.name && newCategory.budget > 0) {
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCategory),
        });

        if (!response.ok) throw new Error("Failed to add category");

        const addedCategory = await response.json();
        setCategories([...categories, addedCategory]);
        setNewCategory({ name: "", budget: 0, color: "#0088FE" });
        setIsAddCategoryOpen(false);
      } catch (err) {
        setError("Error adding category");
        console.error("Error adding category:", err);
      }
    }
  };

  const handleAddTransaction = async () => {
    if (newTransaction.categoryId && newTransaction.amount > 0) {
      try {
        console.log("Submitting transaction:", newTransaction);

        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newTransaction,
            amount: Number(newTransaction.amount), // Ensure amount is sent as a number
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add transaction");
        }

        const addedTransaction = await response.json();
        console.log("Added transaction:", addedTransaction);

        setTransactions([...transactions, addedTransaction]);
        setNewTransaction({
          categoryId: "",
          amount: 0,
          description: "",
          date: format(new Date(), "yyyy-MM-dd"),
        });
        setIsAddTransactionOpen(false);

        // Show success message (optional)
        setError("");
      } catch (err) {
        console.error("Error adding transaction:", err);
        setError(
          err instanceof Error ? err.message : "Error adding transaction"
        );
      }
    } else {
      setError("Please select a category and enter a valid amount");
    }
  };

  const handleEditCategory = async () => {
    if (editCategory && editCategory.name && editCategory.budget > 0) {
      try {
        const response = await fetch(`/api/categories/${editCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editCategory.name,
            budget: editCategory.budget,
            color: editCategory.color,
          }),
        });

        if (!response.ok) throw new Error("Failed to update category");

        setCategories(
          categories.map((cat) =>
            cat.id === editCategory.id ? editCategory : cat
          )
        );
        setEditCategory(null);
        setIsEditCategoryOpen(false);
      } catch (err) {
        setError("Error updating category");
        console.error("Error updating category:", err);
      }
    }
  };

  const handleEditTransaction = async () => {
    if (
      editTransaction &&
      editTransaction.categoryId &&
      editTransaction.amount > 0
    ) {
      try {
        const response = await fetch(
          `/api/transactions/${editTransaction.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              categoryId: editTransaction.categoryId,
              amount: editTransaction.amount,
              description: editTransaction.description,
              date: editTransaction.date,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to update transaction");

        setTransactions(
          transactions.map((trans) =>
            trans.id === editTransaction.id ? editTransaction : trans
          )
        );
        setEditTransaction(null);
        setIsEditTransactionOpen(false);
      } catch (err) {
        setError("Error updating transaction");
        console.error("Error updating transaction:", err);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      setCategories(categories.filter((cat) => cat.id !== categoryId));
      setTransactions(
        transactions.filter((trans) => trans.categoryId !== categoryId)
      );
    } catch (err) {
      setError("Error deleting category");
      console.error("Error deleting category:", err);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete transaction");

      setTransactions(
        transactions.filter((trans) => trans.id !== transactionId)
      );
    } catch (err) {
      setError("Error deleting transaction");
      console.error("Error deleting transaction:", err);
    }
  };

  const getCategorySpending = (categoryId: string) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return transactions
      .filter(
        (trans) =>
          trans.categoryId === categoryId &&
          new Date(trans.date) >= monthStart &&
          new Date(trans.date) <= monthEnd
      )
      .reduce((sum, trans) => sum + trans.amount, 0);
  };

  const getPieChartData = () => {
    return categories.map((category) => ({
      name: category.name,
      value: getCategorySpending(category.id),
      color: category.color,
    }));
  };

  return (
    <main className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Budget Tracker</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                Welcome, {user?.name || "User"}
              </span>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow text-sm font-medium hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="px-4 py-2 bg-black text-white rounded-lg shadow text-sm font-medium hover:bg-gray-800"
            >
              {isYearly ? "Monthly View" : "Yearly View"}
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setCurrentDate(
                    isYearly
                      ? subYears(currentDate, 1)
                      : subMonths(currentDate, 1)
                  )
                }
                className="p-2 bg-black text-white rounded-lg shadow hover:bg-gray-800"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsMonthSelectorOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-800"
              >
                <CalendarIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {format(currentDate, isYearly ? "yyyy" : "MMMM yyyy")}
                </span>
              </button>
              <button
                onClick={() =>
                  setCurrentDate(
                    isYearly
                      ? addYears(currentDate, 1)
                      : addMonths(currentDate, 1)
                  )
                }
                className="p-2 bg-black text-white rounded-lg shadow hover:bg-gray-800"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white text-black border border-gray-400 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Budget</h3>
            <p className="text-3xl font-bold">
              $
              {categories
                .reduce((sum, cat) => sum + cat.budget, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-white text-black border border-gray-400 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
            <p className="text-3xl font-bold">
              $
              {transactions
                .filter((trans) => {
                  const transDate = new Date(trans.date);
                  const monthStart = startOfMonth(currentDate);
                  const monthEnd = endOfMonth(currentDate);
                  return transDate >= monthStart && transDate <= monthEnd;
                })
                .reduce((sum, trans) => sum + trans.amount, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-white text-black border border-gray-400 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Remaining</h3>
            <p className="text-3xl font-bold">
              $
              {(
                categories.reduce((sum, cat) => sum + cat.budget, 0) -
                transactions
                  .filter((trans) => {
                    const transDate = new Date(trans.date);
                    const monthStart = startOfMonth(currentDate);
                    const monthEnd = endOfMonth(currentDate);
                    return transDate >= monthStart && transDate <= monthEnd;
                  })
                  .reduce((sum, trans) => sum + trans.amount, 0)
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories and Spending Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white text-black border border-gray-400 rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Categories</h2>
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Category</span>
                </button>
              </div>
              <div className="space-y-4">
                {categories.map((category) => {
                  const spent = getCategorySpending(category.id);
                  const progress = (spent / category.budget) * 100;
                  return (
                    <div
                      key={category.id}
                      className="bg-gray-200 text-black hover:scale-105 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <h3 className="font-medium">{category.name}</h3>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm">
                            ${spent.toLocaleString()} / $
                            {category.budget.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setEditCategory(category);
                              setIsEditCategoryOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spending Chart */}
            <div className="bg-white text-black border border-gray-400 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">
                Spending Distribution
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white text-black border border-gray-400 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Transactions</h2>
              <button
                onClick={() => setIsAddTransactionOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Transaction</span>
              </button>
            </div>
            <div className="space-y-4">
              {transactions
                .filter((trans) => {
                  const transDate = new Date(trans.date);
                  const monthStart = startOfMonth(currentDate);
                  const monthEnd = endOfMonth(currentDate);
                  return transDate >= monthStart && transDate <= monthEnd;
                })
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((transaction) => {
                  const category = categories.find(
                    (cat) => cat.id === transaction.categoryId
                  );
                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-4 bg-gray-200 text-black rounded-lg hover:scale-105"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm">
                          {format(new Date(transaction.date), "MMM d, yyyy")} •{" "}
                          {category?.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">
                          ${transaction.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditTransaction(transaction);
                            setIsEditTransactionOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteTransaction(transaction.id)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <Transition appear show={isAddCategoryOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddCategoryOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Add New Category
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            name: e.target.value,
                          })
                        }
                        className="mt-1 p-2 h-10 border border-gray-400 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Category Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Budget
                      </label>
                      <input
                        type="text" // Change type to text to allow free input
                        value={
                          newCategory.budget === 0 ? "" : newCategory.budget
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewCategory({
                            ...newCategory,
                            budget: value === "" ? 0 : parseFloat(value),
                          });
                        }}
                        className="mt-1 p-2 block w-full rounded-md h-10 border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="eg. 1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            color: e.target.value,
                          })
                        }
                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsAddCategoryOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleAddCategory}
                    >
                      Add Category
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Transaction Modal */}
      <Transition appear show={isAddTransactionOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddTransactionOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Add New Transaction
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={newTransaction.categoryId}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            categoryId: e.target.value,
                          })
                        }
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="text" // Change type to text to allow free input
                        value={
                          newTransaction.amount === 0
                            ? ""
                            : newTransaction.amount
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewTransaction({
                            ...newTransaction,
                            amount: value === "" ? 0 : parseFloat(value),
                          });
                        }}
                        className="mt-1 p-2 block w-full rounded-md h-10 border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="eg. 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newTransaction.description}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Transaction Description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            date: e.target.value,
                          })
                        }
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsAddTransactionOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleAddTransaction}
                    >
                      Add Transaction
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Category Modal */}
      <Transition appear show={isEditCategoryOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditCategoryOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Edit Category
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editCategory?.name || ""}
                        onChange={(e) =>
                          setEditCategory({
                            ...editCategory,
                            name: e.target.value,
                          } as Category)
                        }
                        className="mt-1 h-10 p-2 border border-gray-400 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Category Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Budget
                      </label>
                      <input
                        type="text" // Change type to text to allow free input
                        value={
                          editCategory?.budget === 0 ? "" : editCategory?.budget
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditCategory({
                            ...editCategory,
                            budget: value === "" ? 0 : parseFloat(value),
                          } as Category);
                        }}
                        className="mt-1 p-2 block w-full rounded-md h-10 border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="eg. 1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <input
                        type="color"
                        value={editCategory?.color || "#0088FE"}
                        onChange={(e) =>
                          setEditCategory({
                            ...editCategory,
                            color: e.target.value,
                          } as Category)
                        }
                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsEditCategoryOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleEditCategory}
                    >
                      Save Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Transaction Modal */}
      <Transition appear show={isEditTransactionOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditTransactionOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Edit Transaction
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={editTransaction?.categoryId || ""}
                        onChange={(e) =>
                          setEditTransaction({
                            ...editTransaction,
                            categoryId: e.target.value,
                          } as Transaction)
                        }
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="text" // Change type to text to allow free input
                        value={
                          editTransaction?.amount === 0
                            ? ""
                            : editTransaction?.amount
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditTransaction({
                            ...editTransaction,
                            amount: value === "" ? 0 : parseFloat(value),
                          } as Transaction);
                        }}
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="eg. 1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editTransaction?.description || ""}
                        onChange={(e) =>
                          setEditTransaction({
                            ...editTransaction,
                            description: e.target.value,
                          } as Transaction)
                        }
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Transaction Description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editTransaction?.date || ""}
                        onChange={(e) =>
                          setEditTransaction({
                            ...editTransaction,
                            date: e.target.value,
                          } as Transaction)
                        }
                        className="mt-1 p-2 h-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsEditTransactionOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleEditTransaction}
                    >
                      Save Changes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Month/Year Selector Modal */}
      <Transition appear show={isMonthSelectorOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsMonthSelectorOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Select {isYearly ? "Year" : "Month"}
                  </Dialog.Title>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {isYearly
                      ? Array.from(
                          { length: 10 },
                          (_, i) => new Date().getFullYear() - 5 + i
                        ).map((year) => (
                          <button
                            key={year}
                            onClick={() => {
                              setCurrentDate(new Date(year, 0, 1));
                              setIsMonthSelectorOpen(false);
                            }}
                            className={`p-2 rounded-lg ${
                              year === currentDate.getFullYear()
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {year}
                          </button>
                        ))
                      : Array.from(
                          { length: 12 },
                          (_, i) => new Date(2000, i, 1)
                        ).map((date) => (
                          <button
                            key={date.getMonth()}
                            onClick={() => {
                              setCurrentDate(
                                new Date(
                                  currentDate.getFullYear(),
                                  date.getMonth(),
                                  1
                                )
                              );
                              setIsMonthSelectorOpen(false);
                            }}
                            className={`p-2 rounded-lg ${
                              date.getMonth() === currentDate.getMonth()
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {format(date, "MMM")}
                          </button>
                        ))}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
}
