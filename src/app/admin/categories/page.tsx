'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children: Category[];
  productsCount: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  parentId: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyParents, setShowOnlyParents] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    parentId: null
  });
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Фильтрация категорий
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !showOnlyParents || !category.parentId;
    return matchesSearch && matchesFilter;
  });

  // Построение дерева категорий
  const buildCategoryTree = (cats: Category[]): Category[] => {
    const tree: Category[] = [];
    const map = new Map<string, Category>();

    // Создаем мапу всех категорий
    cats.forEach(cat => map.set(cat.id, { ...cat, children: [] }));

    // Строим дерево
    cats.forEach(cat => {
      const category = map.get(cat.id)!;
      if (category.parentId) {
        const parent = map.get(category.parentId);
        if (parent) {
          parent.children.push(category);
        } else {
          tree.push(category); // Если родитель не найден, добавляем в корень
        }
      } else {
        tree.push(category);
      }
    });

    return tree;
  };

  const categoryTree = buildCategoryTree(filteredCategories);

  // Переключение развернутого состояния
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Обработчики модальных окон
  const openCreateModal = () => {
    setFormData({ name: '', parentId: null });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
    setFormData({ name: '', parentId: null });
  };

  // Создание категории
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка создания категории');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Ошибка создания категории');
    } finally {
      setFormLoading(false);
    }
  };

  // Обновление категории
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка обновления категории');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Ошибка обновления категории');
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление категории
  const handleDelete = async () => {
    if (!deletingCategory) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCategories();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка удаления категории');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ошибка удаления категории');
    } finally {
      setFormLoading(false);
    }
  };

  // Рендер категории в дереве
  const renderCategoryRow = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0;

    return (
      <div key={category.id}>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              
              <TagIcon className="h-5 w-5 text-indigo-400" />
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">{category.name}</h3>
                  {category.parent && (
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {category.parent.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-400">
                    {category.productsCount} товаров
                  </span>
                  {category.childrenCount > 0 && (
                    <span className="text-sm text-gray-400">
                      {category.childrenCount} подкатегорий
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => openEditModal(category)}
                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                title="Редактировать"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => openDeleteModal(category)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Удалить"
                disabled={category.productsCount > 0 || category.childrenCount > 0}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2 space-y-2">
            {category.children.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Категории</h1>
              <p className="text-gray-300">Управление категориями товаров</p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить категорию</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск категорий..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyParents}
                onChange={(e) => setShowOnlyParents(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-300">Только родительские</span>
            </label>
          </div>
        </div>
      </div>

        {/* Categories Tree */}
        <div className="space-y-3">
        {categoryTree.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <TagIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {searchTerm ? 'Категории не найдены' : 'Нет категорий'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Попробуйте изменить критерии поиска' : 'Создайте первую категорию для начала работы'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
              >
                Создать категорию
              </button>
            )}
          </div>
        ) : (
          categoryTree.map(category => renderCategoryRow(category))
        )}
        </div>

        {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Создать категорию</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название категории
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Введите название..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Родительская категория
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Нет (корневая категория)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent ? `${cat.parent.name} → ${cat.name}` : cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                >
                  {formLoading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Редактировать категорию</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название категории
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Введите название..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Родительская категория
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Нет (корневая категория)</option>
                  {categories
                    .filter(cat => cat.id !== editingCategory.id) // Исключаем саму категорию
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent ? `${cat.parent.name} → ${cat.name}` : cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                >
                  {formLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Удалить категорию</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Вы уверены, что хотите удалить категорию <strong>"{deletingCategory.name}"</strong>?
              </p>
              
              {(deletingCategory.productsCount > 0 || deletingCategory.childrenCount > 0) && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-3">
                  <p className="text-red-300 text-sm">
                    Эту категорию нельзя удалить:
                  </p>
                  <ul className="text-red-300 text-sm mt-1 ml-4">
                    {deletingCategory.productsCount > 0 && (
                      <li>• Содержит {deletingCategory.productsCount} товаров</li>
                    )}
                    {deletingCategory.childrenCount > 0 && (
                      <li>• Содержит {deletingCategory.childrenCount} подкатегорий</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={formLoading || deletingCategory.productsCount > 0 || deletingCategory.childrenCount > 0}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
              >
                {formLoading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
