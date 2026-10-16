import { defineComponent, Fragment, HTMLAttributes, isVNode, VNode, VNodeArrayChildren } from 'vue'

function unwrapSingleChild(children: VNodeArrayChildren): VNode {
  if (children.length !== 1) {
    throw new Error(`RenderSlotWithProps expected 1 child, got ${children.length}`)
  }

  const child = children[0]
  if (Array.isArray(child)) {
    return unwrapSingleChild(child)
  }

  if (!isVNode(child)) {
    throw new Error('RenderSlotWithProps expected a VNode')
  }

  if (child.type === Fragment) {
    if (!Array.isArray(child.children)) {
      throw new Error('RenderSlotWithProps expected Fragment children to be an array')
    }

    return unwrapSingleChild(child.children)
  }

  return child
}

export const RenderSlotWithProps = defineComponent<HTMLAttributes>((props, { slots }) => {
  return () => unwrapSingleChild(slots.default?.() ?? [])
})
