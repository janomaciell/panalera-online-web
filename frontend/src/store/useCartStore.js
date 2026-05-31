import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          })
        } else {
          set({ items: [...items, { ...product, quantity }] })
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter(i => i.id !== id) }),

      updateQty: (id, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter(i => i.id !== id) })
          return
        }
        set({ items: get().items.map(i => i.id === id ? { ...i, quantity } : i) })
      },

      clearCart: () => set({ items: [] }),

      // Computed helpers — called as functions, not getters
      // Usage: useCartStore(s => s.getTotal())
      getTotal: () =>
        get().items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),

      getCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'panalera-cart' }
  )
)
