export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
export const isEvent = key => key.startsWith('on');
export const isProperty = key => key !== 'children' && !isEvent(key);
export const isNew = (prevProps, nextProps) => key => prevProps[key] !== nextProps[key]
export const isGone = (prevProps, nextProps) => key => !(key in nextProps);
export const getEventName = name => name.toLowerCase().substring(2)
