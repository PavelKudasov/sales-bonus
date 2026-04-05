/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
    // Скидка в процентах переводится в коэффициент (например, 10% -> 0.9)
    const discountCoefficient = 1 - (discount / 100);
    // Выручка = цена * количество * коэффициент скидки
    return sale_price * quantity * discountCoefficient;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    
    if (index === 0) {
        // 1 место — 15% от прибыли
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        // 2 и 3 место — 10% от прибыли
        return profit * 0.10;
    } else if (index === total - 1) {
        // Последнее место — 0%
        return 0;
    } else {
        // Все остальные — 5% от прибыли
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data 
        || !Array.isArray(data.sellers) 
        || !Array.isArray(data.products) 
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы функции расчёта');
    }

    // --- ПОДГОТОВКА СТАТИСТИКИ ---
    // Создаём массив для накопления данных по каждому продавцу
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {} // Объект для подсчёта товаров: { 'SKU_001': 5 }
    }));

    // Создаём индексы для быстрого поиска (чтобы не искать в массивах каждый раз)
    const sellerIndex = Object.fromEntries(
        sellerStats.map(s => [s.id, s])
    );
    const productIndex = Object.fromEntries(
        data.products.map(p => [p.sku, p])
    );

    // --- ОБРАБОТКА ЧЕКОВ (БИЗНЕС-ЛОГИКА) ---
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return; // Если продавец не найден, пропускаем
        
        // Обновляем общую статистику по чеку
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
        
        // Обрабатываем каждый товар в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return; // Если товар не найден, пропуска
            
            // Себестоимость = цена закупки * количество
            const cost = product.purchase_price * item.quantity;
            
            // Выручка через переданную функцию (с учётом скидки)
            const revenue = calculateRevenue(item, product);
            
            // Прибыль = Выручка - Себестоимость
            const itemProfit = revenue - cost;
            seller.profit += itemProfit;
            
            // Считаем количество проданных товаров по артикулам
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // --- СОРТИРОВКА ПО ПРИБЫЛИ (по убыванию) ---
    sellerStats.sort((a, b) => b.profit - a.profit);

    // --- РАСЧЁТ БОНУСОВ И ТОП-10 ТОВАРОВ ---
    sellerStats.forEach((seller, index) => {
        // Считаем бонус
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        
        // Формируем топ-10 товаров
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity) // Сортируем по количеству
            .slice(0, 10); // Берём первые 10
    });

    // --- ФОРМИРОВАНИЕ ИТОГОВОГО ОТЧЁТА ---
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),   // Округляем до 2 знаков
        profit: +seller.profit.toFixed(2),     // Округляем до 2 знаков
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)        // Округляем до 2 знаков
    }));
    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями
}
