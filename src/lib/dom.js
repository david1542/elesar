import { getEventName, isEvent, isGone, isNew, isProperty } from '../utils'

export const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object' ? child : createTextElement(child))
    }
  }
}

export const createTextElement = (text) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

export const createDom = (element) => {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type)

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(prop => {
      dom[prop] = element.props[prop]
    })

  // Adding event listeners
  Object.keys(element.props)
    .filter(isEvent)
    .forEach(prop => {
      const eventName = getEventName(prop);
      dom.addEventListener(eventName, element.props[prop]);
    })
  return dom
}

export const updateDom = (element, prevProps, nextProps) => {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(key => {
      const eventName = getEventName(key)
      element.removeEventListener(eventName, prevProps[key])
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(key => {
      element[key] = '';
    })

  // Adding new properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(key => {
      element[key] = nextProps[key];
    })

  // Adding new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(key => {
      const eventName = key.toLowerCase().substring(2)
      element.addEventListener(eventName, nextProps[key])
    })
}
