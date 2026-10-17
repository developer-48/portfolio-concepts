// Price selections persist; the preview follows the latest explicit choice.
export function resolveVisualEffect(previous,next,activeEffect){
  if(!previous||previous.vehicle!==next.vehicle||previous.key!==next.key)return next.key;
  const added=next.extras.filter(key=>!previous.extras.includes(key)&&!(next.key==='refresh'&&key==='interior'));
  if(added.length)return added.at(-1);
  if(activeEffect&&activeEffect!==next.key&&!next.extras.includes(activeEffect))return next.key;
  return null;
}
