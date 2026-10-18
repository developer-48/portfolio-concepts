// Source object names carry semantics that are lost after material batching.
// In particular, tailgate lenses must never enter the window batch, and a
// chrome door handle using a wheel material is still part of the interior.
export function classifySurface(name,material,vehicle){
  const suffix=name.lastIndexOf('_'+material);
  const object=suffix>0?name.slice(0,suffix):name;
  // The source batches the GLS rear, quarter and roof panes under a carbon name.
  // Keep the surrounding chrome frames opaque; only this verified pane object is glass.
  if(vehicle==='suv' && /^gls_sunroof_gls_carbonn/.test(name))return 'glass';
  if(vehicle==='suv' && /_mirror\.159_/.test(name))return 'mirror';
  if(vehicle==='suv' && /^gls_tailgate_gls_stop/.test(name))return 'rear-reflector';
  const glazing=/glass|window/i.test(material);
  if(/paint_2$/i.test(material))return 'trim';
  if(glazing&&/mirror/i.test(object))return 'mirror';
  if(glazing&&/tail.*light|brake.*light|bumper_R/i.test(object))return 'rear-lens';
  if(glazing&&/head.*light|fog.*light|bumper_F/i.test(object))return 'lens';
  if(/paint|marina_bay_blue|^body$/i.test(material))return 'paint';
  if(glazing){
    if(/dash|screen/i.test(object))return 'screen';
    if(/roof|sunroof/i.test(object))return 'roof-glass';
    return 'glass';
  }
  if(/wheel|rim|brake|calliper|tires|caliper|disc/i.test(object)||(vehicle==='crossover'&&/tires|rim|disc|caliper/i.test(material)))return 'wheels';
  if(/taillight|tailgatelight|brakelight/i.test(object)&&/run|rear|brake|vehiclelights|taillight/i.test(material))return 'rear-reflector';
  if(/interior|leather|seat|dashboard|torped|alcantara|carpet|black_int|doorpanel/i.test(object+' '+material))return 'interior';
  return 'detail';
}
