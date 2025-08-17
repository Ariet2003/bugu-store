'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  FireIcon,
  BarsArrowUpIcon,
  CheckIcon,
  CalendarDaysIcon,
  ArchiveBoxIcon,
  BarsArrowDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TagIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import AddProductModal from '@/components/admin/products/AddProductModal';
import { ToastContainer } from '@/components/admin/products/Toast';
import { useToast } from '@/hooks/useToast';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variantsCount: number;
  totalQuantity: number;
  minPrice: number;
  maxPrice: number;
  mainImage: string | null;
  variants: number;
  images: number;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  attributes: { name: string; value: string }[];
  images: string[];
}

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  variants: ProductVariant[];
}

type SortOption = 'newest' | 'name' | 'price' | 'quantity' | 'category';
type SortOrder = 'asc' | 'desc';

export default function ProductsPage() {
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 50;
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    isActive: true,
    variants: []
  });
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка товаров
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Умный поиск
  const smartSearch = (text: string, searchQuery: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    const textWords = text.toLowerCase().split(/\s+/);
    const searchWords = searchQuery.toLowerCase().split(/\s+/);
    
    return searchWords.every(searchWord => 
      textWords.some(textWord => textWord.includes(searchWord))
    );
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = smartSearch(product.name + ' ' + product.description, searchTerm);
    const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Сортировка товаров
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'newest':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ru');
        break;
      case 'price':
        comparison = a.minPrice - b.minPrice;
        break;
      case 'quantity':
        comparison = b.totalQuantity - a.totalQuantity;
        break;
      case 'category':
        comparison = a.category.name.localeCompare(b.category.name, 'ru');
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  // Пагинация
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  // Клавиатурные сокращения
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Обработчики модальных окон
  const openCreateModal = () => {
    setFormData({ name: '', description: '', categoryId: '', isActive: true, variants: [] });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      isActive: product.isActive,
      variants: [] // TODO: Загрузить варианты продукта
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
    setFormData({ name: '', description: '', categoryId: '', isActive: true, variants: [] });
  };

  // Создание товара с вариантами
  const handleCreateProduct = async (data: ProductFormData) => {
    setFormLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchProducts();
        closeModals();
        // Показываем уведомление после закрытия модального окна
        setTimeout(() => {
          showSuccess('Товар создан', 'Товар успешно добавлен в каталог');
        }, 100);
      } else {
        const error = await response.json();
        showError('Ошибка создания', error.error || 'Ошибка создания товара');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showError('Ошибка создания', 'Ошибка создания товара');
    } finally {
      setFormLoading(false);
    }
  };

  // Обновление товара
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !formData.name.trim() || !formData.categoryId) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProducts();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка обновления товара');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ошибка обновления товара');
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление товара
  const handleDelete = async () => {
    if (!deletingProduct) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProducts();
        closeModals();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка удаления товара');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ошибка удаления товара');
    } finally {
      setFormLoading(false);
    }
  };

  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
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
              <h1 className="text-3xl font-bold text-white mb-2">Товары</h1>
              <p className="text-gray-300">Управление каталогом товаров</p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Добавить товар</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
          <div className="space-y-4">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 text-sm sm:text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Sort Controls */}
              <div className="flex items-center space-x-2 flex-1">
                <div className="flex-1 sm:flex-none">
                  <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 sm:px-4 py-3">
                    <BarsArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                    >
                      <option value="newest" className="bg-gray-800">По новизне</option>
                      <option value="name" className="bg-gray-800">По названию</option>
                      <option value="price" className="bg-gray-800">По цене</option>
                      <option value="quantity" className="bg-gray-800">По количеству</option>
                      <option value="category" className="bg-gray-800">По категории</option>
                    </select>
                    <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`flex items-center justify-center w-11 h-11 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                    sortOrder === 'desc'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                  }`}
                  title={sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
                >
                  {sortOrder === 'desc' ? (
                    <ArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex-1 sm:flex-none">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 sm:px-4 py-3">
                  <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                  >
                    <option value="" className="bg-gray-800">Все категории</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className="bg-gray-800">
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex-1 sm:flex-none">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 sm:px-4 py-3">
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                  >
                    <option value="all" className="bg-gray-800">Все статусы</option>
                    <option value="active" className="bg-gray-800">Активные</option>
                    <option value="inactive" className="bg-gray-800">Неактивные</option>
                  </select>
                  <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <ArchiveBoxIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">
                      {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                    </span>
                    <span className="hidden sm:inline">
                      Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                    </span>
                  </span>
                </div>
                
                {searchTerm && (
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      <span className="sm:hidden">"{searchTerm}"</span>
                      <span className="hidden sm:inline">Поиск: "{searchTerm}"</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-3">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <CubeIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm || categoryFilter || statusFilter !== 'all' ? 'Товары не найдены' : 'Нет товаров'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter || statusFilter !== 'all' 
                  ? 'Попробуйте изменить критерии поиска' 
                  : 'Создайте первый товар для начала работы'
                }
              </p>
              {!searchTerm && !categoryFilter && statusFilter === 'all' && (
                <button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
                >
                  Создать товар
                </button>
              )}
            </div>
          ) : (
            paginatedProducts.map(product => (
              <div key={product.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800/70 transition-all duration-200">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gray-700/50 rounded-lg overflow-hidden">
                      {product.mainImage ? (
                        <img 
                          src={product.mainImage} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h3 className="font-medium text-white text-sm sm:text-base truncate">{product.name}</h3>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                            {product.category.name}
                          </span>
                          
                          <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                            product.isActive 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {product.isActive ? (
                              <EyeIcon className="h-3 w-3" />
                            ) : (
                              <EyeSlashIcon className="h-3 w-3" />
                            )}
                            <span>{product.isActive ? 'Активен' : 'Скрыт'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-1">
                        <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                          <CurrencyDollarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>
                            {product.minPrice === product.maxPrice 
                              ? formatPrice(product.minPrice)
                              : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                          <ArchiveBoxIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{product.totalQuantity} шт</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                          <TagIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{product.variantsCount} вариантов</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <CalendarDaysIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{new Date(product.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => openDeleteModal(product)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination with Sort Indicator */}
        {totalPages > 1 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-xs sm:text-sm text-gray-400">
                  <span className="sm:hidden">
                    {currentPage}/{totalPages}
                  </span>
                  <span className="hidden sm:inline">
                    Страница {currentPage} из {totalPages}
                  </span>
                </div>
                
                {/* Sort indicator in same row */}
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                  {sortBy === 'newest' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                      <span className="text-blue-400 font-medium hidden sm:inline">По новизне</span>
                      <span className="text-blue-400 font-medium sm:hidden">Новизне</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-blue-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'name' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <BarsArrowUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                      <span className="text-green-400 font-medium hidden sm:inline">По названию</span>
                      <span className="text-green-400 font-medium sm:hidden">Названию</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'price' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <CurrencyDollarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-400 font-medium hidden sm:inline">По цене</span>
                      <span className="text-yellow-400 font-medium sm:hidden">Цене</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'quantity' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <ArchiveBoxIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                      <span className="text-purple-400 font-medium hidden sm:inline">По количеству</span>
                      <span className="text-purple-400 font-medium sm:hidden">Количеству</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                  {sortBy === 'category' && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <TagIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 flex-shrink-0" />
                      <span className="text-orange-400 font-medium hidden sm:inline">По категории</span>
                      <span className="text-orange-400 font-medium sm:hidden">Категории</span>
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-2 w-2 sm:h-3 sm:w-3 text-orange-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpIcon className="h-2 w-2 sm:h-3 sm:w-3 text-orange-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {/* First Page - Hide on mobile */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Первая страница"
                >
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Предыдущая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {/* Mobile: 3 buttons, Desktop: 5 buttons */}
                  <div className="flex sm:hidden items-center space-x-1">
                    {[...Array(Math.min(3, totalPages))].map((_, index) => {
                      let pageNumber;
                      
                      if (totalPages <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 2) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNumber = totalPages - 2 + index;
                      } else {
                        pageNumber = currentPage - 1 + index;
                      }

                      const isActive = pageNumber === currentPage;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 min-w-[32px] ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Desktop: 5 buttons */}
                  <div className="hidden sm:flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      let pageNumber;
                      
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      const isActive = pageNumber === currentPage;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 min-w-[36px] ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Следующая"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
                </button>

                {/* Last Page - Hide on mobile */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Последняя страница"
                >
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-400">
                <span className="sm:hidden">
                  {totalItems} всего
                </span>
                <span className="hidden sm:inline">
                  {totalItems} товаров всего
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        <AddProductModal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          onSubmit={handleCreateProduct}
          categories={categories}
          loading={formLoading}
          onShowWarning={(title, message) => showWarning(title, message)}
          onShowError={(title, message) => showError(title, message)}
        />

        {/* Edit Modal */}
        {isEditModalOpen && editingProduct && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700/50 shadow-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Редактировать товар</h2>
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
                    Название товара
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
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите описание..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Категория
                  </label>
                  <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-3 sm:px-4 py-3">
                    <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer min-w-0 flex-1"
                      required
                    >
                      <option value="" className="bg-gray-800">Выберите категорию</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id} className="bg-gray-800">
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-300">Активный товар</span>
                  </label>
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
        {isDeleteModalOpen && deletingProduct && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800/95 backdrop-blur-md rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700/50 shadow-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Удалить товар</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex-shrink-0">
                    <TrashIcon className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-300 mb-1">
                      Подтверждение удаления
                    </h3>
                    <p className="text-gray-300">
                      Вы уверены, что хотите удалить товар <strong className="text-white">"{deletingProduct.name}"</strong>?
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm">
                    ⚠️ <strong>Внимание:</strong> Это действие необратимо. Товар будет удален навсегда.
                  </p>
                </div>
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
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
                >
                  {formLoading ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </AdminLayout>
  );
}
