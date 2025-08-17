'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  SwatchIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  HashtagIcon,
  PercentBadgeIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';

import ColorPicker from './ColorPicker';
import SizePicker from './SizePicker';
import ImageUploadModal from './ImageUploadModal';

interface Category {
  id: string;
  name: string;
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

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  categories: Category[];
  loading?: boolean;
  onShowWarning?: (title: string, message: string) => void;
  onShowError?: (title: string, message: string) => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  loading = false,
  onShowWarning,
  onShowError
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: '',
    isActive: true,
    variants: []
  });

  const [currentVariant, setCurrentVariant] = useState<ProductVariant>({
    id: '',
    size: '',
    color: '',
    sku: '',
    quantity: 0,
    price: 0,
    attributes: [],
    images: []
  });

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        isActive: true,
        variants: []
      });
      setCurrentVariant({
        id: '',
        size: '',
        color: '',
        sku: '',
        quantity: 0,
        price: 0,
        attributes: [],
        images: []
      });
      setShowVariantForm(false);
      setEditingVariantIndex(null);
      setShowDiscount(false);
      setNewAttribute({ name: '', value: '' });
    }
  }, [isOpen]);



  const handleVariantSave = () => {
    if (!currentVariant.size || !currentVariant.color || currentVariant.price <= 0) {
      onShowWarning?.('Не все поля заполнены', 'Пожалуйста, заполните размер, цвет и цену варианта');
      return;
    }

    const variant = {
      ...currentVariant,
      id: editingVariantIndex !== null 
        ? formData.variants[editingVariantIndex].id 
        : Date.now().toString()
    };

    if (editingVariantIndex !== null) {
      const newVariants = [...formData.variants];
      newVariants[editingVariantIndex] = variant;
      setFormData({ ...formData, variants: newVariants });
    } else {
      setFormData({ ...formData, variants: [...formData.variants, variant] });
    }

    // Reset form
    setCurrentVariant({
      id: '',
      size: '',
      color: '',
      sku: '',
      quantity: 0,
      price: 0,
      attributes: [],
      images: []
    });
    setShowVariantForm(false);
    setEditingVariantIndex(null);
    setShowDiscount(false);
  };

  const handleVariantEdit = (index: number) => {
    setCurrentVariant(formData.variants[index]);
    setEditingVariantIndex(index);
    setShowVariantForm(true);
    setShowDiscount(!!formData.variants[index].discountPrice);
  };

  const handleVariantDelete = (index: number) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleAddAttribute = () => {
    if (!newAttribute.name.trim() || !newAttribute.value.trim()) return;
    
    const newAttr = { name: newAttribute.name.trim(), value: newAttribute.value.trim() };
    
    setCurrentVariant(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttr]
    }));
    
    setNewAttribute({ name: '', value: '' });
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = currentVariant.attributes.filter((_, i) => i !== index);
    setCurrentVariant({ ...currentVariant, attributes: newAttributes });
  };

  const handleImagesUpdate = (images: string[]) => {
    setCurrentVariant({ ...currentVariant, images });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.categoryId) {
      onShowError?.('Не все поля заполнены', 'Пожалуйста, заполните название и выберите категорию');
      return;
    }

    if (formData.variants.length === 0) {
      onShowError?.('Нет вариантов товара', 'Добавьте хотя бы один вариант товара');
      return;
    }

    try {
      await onSubmit(formData);
      // Сначала закрываем модальное окно
      onClose();
    } catch (error) {
      onShowError?.('Ошибка создания', 'Не удалось создать товар. Попробуйте еще раз');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-white">Добавить товар</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
                <span>Основная информация</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите название товара"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Категория *
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Введите описание товара"
                    rows={3}
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Статус
                  </label>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 border border-gray-600/50 rounded-lg h-[84px]">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-5 h-5 text-green-400">
                        <CubeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">Активный товар</span>
                        <p className="text-xs text-gray-400">Товар будет виден покупателям</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        formData.isActive ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <CubeIcon className="h-5 w-5" />
                  <span>Варианты товара ({formData.variants.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVariantForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Добавить вариант</span>
                </button>
              </div>

              {/* Variants List */}
              {formData.variants.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.variants.map((variant, index) => (
                    <div key={variant.id} className="bg-gray-600/30 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border border-gray-500"
                              style={{ backgroundColor: variant.color }}
                            />
                            <span className="text-gray-300">{variant.size}</span>
                          </div>
                          <span className="text-gray-400">SKU: {variant.sku || 'N/A'}</span>
                          <span className="text-gray-400">{variant.quantity} шт</span>
                          <span className="text-green-400 font-medium">{variant.price} ₽</span>
                          {variant.discountPrice && (
                            <span className="text-red-400 font-medium">{variant.discountPrice} ₽</span>
                          )}
                        </div>
                        {variant.attributes.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            Атрибуты: {variant.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleVariantEdit(index)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <PaintBrushIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVariantDelete(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Form */}
              {showVariantForm && (
                <div className="bg-gray-600/30 rounded-lg p-4 space-y-4 border border-gray-600/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">
                      {editingVariantIndex !== null ? 'Редактировать вариант' : 'Новый вариант'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVariantForm(false);
                        setEditingVariantIndex(null);
                        setCurrentVariant({
                          id: '',
                          size: '',
                          color: '',
                          sku: '',
                          quantity: 0,
                          price: 0,
                          attributes: [],
                          images: []
                        });
                        setShowDiscount(false);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Color Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Цвет *
                      </label>
                      <ColorPicker
                        selectedColor={currentVariant.color}
                        onColorChange={(color) => setCurrentVariant({ ...currentVariant, color })}
                      />
                    </div>

                    {/* Size Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Размер *
                      </label>
                      <SizePicker
                        selectedSize={currentVariant.size}
                        onSizeChange={(size) => setCurrentVariant({ ...currentVariant, size })}
                      />
                    </div>

                    {/* SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Артикул (SKU)
                      </label>
                      <input
                        type="text"
                        value={currentVariant.sku}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, sku: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Введите артикул"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Количество *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentVariant.quantity}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0"
                        required
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Цена *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentVariant.price}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {/* Discount Button/Price */}
                    <div>
                      {!showDiscount ? (
                        <button
                          type="button"
                          onClick={() => setShowDiscount(true)}
                          className="mt-6 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-700 hover:to-green-600 transition-all duration-200"
                        >
                          <PercentBadgeIcon className="h-4 w-4" />
                          <span>Добавить скидку</span>
                        </button>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Цена со скидкой
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentVariant.discountPrice || ''}
                              onChange={(e) => setCurrentVariant({ 
                                ...currentVariant, 
                                discountPrice: parseFloat(e.target.value) || undefined 
                              })}
                              className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowDiscount(false);
                                setCurrentVariant({ ...currentVariant, discountPrice: undefined });
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Дополнительные атрибуты
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleAddAttribute}
                          disabled={!newAttribute.name.trim() || !newAttribute.value.trim()}
                          className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:from-purple-700 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                        >
                          <PlusIcon className="h-3 w-3" />
                          <span>Добавить</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={newAttribute.name}
                        onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                        className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Название атрибута"
                      />
                      <input
                        type="text"
                        value={newAttribute.value}
                        onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                        className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Значение"
                      />
                    </div>

                    {currentVariant.attributes.length > 0 && (
                      <div className="space-y-1">
                        {currentVariant.attributes.map((attr, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-700/30 rounded px-3 py-2">
                            <span className="text-sm text-gray-300">
                              <strong>{attr.name}:</strong> {attr.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttribute(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Фотографии ({currentVariant.images.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 hover:from-blue-700 hover:to-blue-600 transition-all duration-200"
                      >
                        <PhotoIcon className="h-3 w-3" />
                        <span>Добавить фото</span>
                      </button>
                    </div>
                    
                    {currentVariant.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {currentVariant.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-20 rounded border border-gray-600 overflow-hidden bg-gray-600">
                              <img
                                src={image}
                                alt={`Фото ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = currentVariant.images.filter((_, i) => i !== index);
                                setCurrentVariant({ ...currentVariant, images: newImages });
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <XMarkIcon className="h-2 w-2" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Variant Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-600/50">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVariantForm(false);
                        setEditingVariantIndex(null);
                        setCurrentVariant({
                          id: '',
                          size: '',
                          color: '',
                          sku: '',
                          quantity: 0,
                          price: 0,
                          attributes: [],
                          images: []
                        });
                        setShowDiscount(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleVariantSave}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200"
                    >
                      {editingVariantIndex !== null ? 'Сохранить изменения' : 'Добавить вариант'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 bg-gray-800/50 border-t border-gray-700/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.variants.length === 0}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать товар'}
          </button>
        </div>

        {/* Image Upload Modal */}
        {showImageModal && (
          <ImageUploadModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            onImagesUpdate={handleImagesUpdate}
            currentImages={currentVariant.images}
          />
        )}


      </div>
    </div>
  );
}
