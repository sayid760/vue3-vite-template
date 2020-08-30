import { mount } from '@vue/test-utils'
import HelloWorld from '@/HelloWorld.vue'

test('displays message', async () => {
  const wrapper = await mount(HelloWorld)

  // Assert the rendered text of the component
  expect(wrapper.find('p').text()).toBe('0')
  await wrapper.find('button').trigger('click')
  expect(wrapper.find('p').text()).toBe('1')
})
