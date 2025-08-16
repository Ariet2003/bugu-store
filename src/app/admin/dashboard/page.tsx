export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🎉 Добро пожаловать в админ-панель Bugu Store!
        </h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Аутентификация прошла успешно
          </h2>
          <p className="text-gray-300">
            Вы успешно вошли в систему администрирования.
          </p>
        </div>
        
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-3">
            Доступные функции:
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Управление товарами</li>
            <li>• Обработка заказов</li>
            <li>• Управление категориями</li>
            <li>• Настройки системы</li>
          </ul>
        </div>
      </div>
    </div>
  );
}