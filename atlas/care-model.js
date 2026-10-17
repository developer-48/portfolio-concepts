(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.AtlasCare = model;
})(globalThis, function () {
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const packages = {
    refresh: {title:'Химчистка салона',price:11000,time:'1–2 дня',includes:['interior'],items:['Очистка кожи, текстиля и пластика','Работа с труднодоступными зонами','Сушка и контроль результата']},
    restore: {title:'Полировка и покрытие',price:38000,time:'2–3 дня',includes:[],items:['Многоэтапная очистка кузова','Согласованная коррекция лака','Нанесение защитного покрытия']},
    protect: {title:'Защита плёнкой',price:85000,time:'3–4 дня',includes:[],items:['Очистка и подготовка поверхности','Плёнка: капот, бампер, передние крылья','Оклейка зеркал и контроль краёв']}
  };
  const extras = {glass:{title:'Уход за стёклами',price:3500},wheels:{title:'Уход за дисками',price:6000},interior:{title:'Химчистка салона',price:12000}};
  const vehicles = {coupe:{name:'Купе',factor:1},sedan:{name:'Седан',factor:1},crossover:{name:'Кроссовер',factor:1.2},suv:{name:'Большой SUV',factor:1.4}};
  function initial(program) {
    return {vehicle:'coupe',program:has(packages,program)?program:'restore',extras:[]};
  }
  function change(state, action) {
    if (action.type==='vehicle' && has(vehicles,action.value)) return {...state,vehicle:action.value};
    if (action.type==='program' && has(packages,action.value)) return {...state,program:action.value};
    if (action.type==='extra' && has(extras,action.value)) {
      // Included work is never billed or toggled. Explicit choices survive program changes.
      if (packages[state.program].includes.includes(action.value)) return state;
      const selected=new Set(state.extras);
      if (action.checked) selected.add(action.value); else selected.delete(action.value);
      return {...state,extras:[...selected]};
    }
    return state;
  }
  function calculate(state) {
    const pack=packages[state.program];
    const {factor,name:className}=vehicles[state.vehicle];
    const effective=[...new Set([...pack.includes,...state.extras])];
    const paid=Object.keys(extras).filter(key=>state.extras.includes(key)&&!pack.includes.includes(key));
    const chosen=paid.map(key=>({...extras[key],key}));
    const base=Math.round(pack.price*factor);
    return {key:state.program,vehicle:state.vehicle,pack,factor,className,chosen,base,effective,paid,total:base+chosen.reduce((sum,item)=>sum+Math.round(item.price*factor),0)};
  }
  return {packages,extras,vehicles,initial,change,calculate};
});
