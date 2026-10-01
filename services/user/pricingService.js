const FREE_SHIPPING_LIMIT = 999
const SHIPPING_CHARGE = 99

export const calculateOrderTotals = (items, { couponDiscount = 0, productDiscount = 0 } = {}) => {
   const activeItems = items.filter( item => !["Cancelled", "Returned"].includes(item.status))

    const subtotal = activeItems.reduce((total, item) => total + item.total, 0)

    const shippingCharge = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_CHARGE

    let grandTotal = subtotal - productDiscount - couponDiscount + shippingCharge

    if (grandTotal < 0) {
        grandTotal = 0
    }

    return {
        activeItems,
        subtotal,
        productDiscount,
        couponDiscount,
        shippingCharge,
        grandTotal
    }
}