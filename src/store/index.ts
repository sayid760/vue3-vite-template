import  { createStore }  from 'vuex'

const store = createStore({
  state: {
    isShowBack: true
  },
  getters: {
    isShowBack (state: any) {
      return state.isShowBack
    }
  },
  mutations: {
    setShowBack (state: any, isShowBack: boolean) {
      state.isShowBack = isShowBack
    }
  },
  actions: {},
  modules: {}
})

export default store