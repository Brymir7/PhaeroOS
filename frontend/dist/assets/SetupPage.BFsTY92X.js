import{l as H,n as X,s as P,o as y,_ as C,r as n,p as se,q as G,t as ae,v as oe,T as $,j as t,w as D,S as ne,x as V,y as re,z as W,C as ie,D as le,E as ce,M as B,H as U,i as q,a as Y,G as de,I as ue,J,K as Q,N as Z,O as R,Q as ee,B as M,U as pe,V as he,W as me,X as ge,Y as K,A as _,Z as O,$ as xe,P as fe}from"./index.BK-hnW84.js";function be(e){return X("MuiFormControlLabel",e)}const ve=H("MuiFormControlLabel",["root","labelPlacementStart","labelPlacementTop","labelPlacementBottom","disabled","label","error","required","asterisk"]),L=ve,we=["checked","className","componentsProps","control","disabled","disableTypography","inputRef","label","labelPlacement","name","onChange","required","slotProps","value"],ye=e=>{const{classes:s,disabled:a,labelPlacement:i,error:r,required:l}=e,p={root:["root",a&&"disabled",`labelPlacement${y(i)}`,r&&"error",l&&"required"],label:["label",a&&"disabled"],asterisk:["asterisk",r&&"error"]};return V(p,be,s)},Ce=P("label",{name:"MuiFormControlLabel",slot:"Root",overridesResolver:(e,s)=>{const{ownerState:a}=e;return[{[`& .${L.label}`]:s.label},s.root,s[`labelPlacement${y(a.labelPlacement)}`]]}})(({theme:e,ownerState:s})=>C({display:"inline-flex",alignItems:"center",cursor:"pointer",verticalAlign:"middle",WebkitTapHighlightColor:"transparent",marginLeft:-11,marginRight:16,[`&.${L.disabled}`]:{cursor:"default"}},s.labelPlacement==="start"&&{flexDirection:"row-reverse",marginLeft:16,marginRight:-11},s.labelPlacement==="top"&&{flexDirection:"column-reverse",marginLeft:16},s.labelPlacement==="bottom"&&{flexDirection:"column",marginLeft:16},{[`& .${L.label}`]:{[`&.${L.disabled}`]:{color:(e.vars||e).palette.text.disabled}}})),je=P("span",{name:"MuiFormControlLabel",slot:"Asterisk",overridesResolver:(e,s)=>s.asterisk})(({theme:e})=>({[`&.${L.error}`]:{color:(e.vars||e).palette.error.main}})),Se=n.forwardRef(function(s,a){var i,r;const l=se({props:s,name:"MuiFormControlLabel"}),{className:p,componentsProps:g={},control:c,disabled:b,disableTypography:u,label:h,labelPlacement:v="end",required:S,slotProps:x={}}=l,F=G(l,we),k=ae(),T=(i=b??c.props.disabled)!=null?i:k==null?void 0:k.disabled,j=S??c.props.required,I={disabled:T,required:j};["checked","name","onChange","value","inputRef"].forEach(d=>{typeof c.props[d]>"u"&&typeof l[d]<"u"&&(I[d]=l[d])});const E=oe({props:l,muiFormControl:k,states:["error"]}),z=C({},l,{disabled:T,labelPlacement:v,required:j,error:E.error}),N=ye(z),w=(r=x.typography)!=null?r:g.typography;let o=h;return o!=null&&o.type!==$&&!u&&(o=t.jsx($,C({component:"span"},w,{className:D(N.label,w==null?void 0:w.className),children:o}))),t.jsxs(Ce,C({className:D(N.root,p),ownerState:z,ref:a},F,{children:[n.cloneElement(c,I),j?t.jsxs(ne,{display:"block",children:[o,t.jsxs(je,{ownerState:z,"aria-hidden":!0,className:N.asterisk,children:[" ","*"]})]}):o]}))}),ke=Se;function Ne(e){return X("MuiSwitch",e)}const m=H("MuiSwitch",["root","edgeStart","edgeEnd","switchBase","colorPrimary","colorSecondary","sizeSmall","sizeMedium","checked","disabled","input","thumb","track"]),$e=["className","color","edge","size","sx"],Pe=ce(),ze=e=>{const{classes:s,edge:a,size:i,color:r,checked:l,disabled:p}=e,g={root:["root",a&&`edge${y(a)}`,`size${y(i)}`],switchBase:["switchBase",`color${y(r)}`,l&&"checked",p&&"disabled"],thumb:["thumb"],track:["track"],input:["input"]},c=V(g,Ne,s);return C({},s,c)},Le=P("span",{name:"MuiSwitch",slot:"Root",overridesResolver:(e,s)=>{const{ownerState:a}=e;return[s.root,a.edge&&s[`edge${y(a.edge)}`],s[`size${y(a.size)}`]]}})({display:"inline-flex",width:34+12*2,height:14+12*2,overflow:"hidden",padding:12,boxSizing:"border-box",position:"relative",flexShrink:0,zIndex:0,verticalAlign:"middle","@media print":{colorAdjust:"exact"},variants:[{props:{edge:"start"},style:{marginLeft:-8}},{props:{edge:"end"},style:{marginRight:-8}},{props:{size:"small"},style:{width:40,height:24,padding:7,[`& .${m.thumb}`]:{width:16,height:16},[`& .${m.switchBase}`]:{padding:4,[`&.${m.checked}`]:{transform:"translateX(16px)"}}}}]}),Re=P(re,{name:"MuiSwitch",slot:"SwitchBase",overridesResolver:(e,s)=>{const{ownerState:a}=e;return[s.switchBase,{[`& .${m.input}`]:s.input},a.color!=="default"&&s[`color${y(a.color)}`]]}})(({theme:e})=>({position:"absolute",top:0,left:0,zIndex:1,color:e.vars?e.vars.palette.Switch.defaultColor:`${e.palette.mode==="light"?e.palette.common.white:e.palette.grey[300]}`,transition:e.transitions.create(["left","transform"],{duration:e.transitions.duration.shortest}),[`&.${m.checked}`]:{transform:"translateX(20px)"},[`&.${m.disabled}`]:{color:e.vars?e.vars.palette.Switch.defaultDisabledColor:`${e.palette.mode==="light"?e.palette.grey[100]:e.palette.grey[600]}`},[`&.${m.checked} + .${m.track}`]:{opacity:.5},[`&.${m.disabled} + .${m.track}`]:{opacity:e.vars?e.vars.opacity.switchTrackDisabled:`${e.palette.mode==="light"?.12:.2}`},[`& .${m.input}`]:{left:"-100%",width:"300%"}}),({theme:e})=>({"&:hover":{backgroundColor:e.vars?`rgba(${e.vars.palette.action.activeChannel} / ${e.vars.palette.action.hoverOpacity})`:W(e.palette.action.active,e.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}},variants:[...Object.entries(e.palette).filter(([,s])=>s.main&&s.light).map(([s])=>({props:{color:s},style:{[`&.${m.checked}`]:{color:(e.vars||e).palette[s].main,"&:hover":{backgroundColor:e.vars?`rgba(${e.vars.palette[s].mainChannel} / ${e.vars.palette.action.hoverOpacity})`:W(e.palette[s].main,e.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}},[`&.${m.disabled}`]:{color:e.vars?e.vars.palette.Switch[`${s}DisabledColor`]:`${e.palette.mode==="light"?ie(e.palette[s].main,.62):le(e.palette[s].main,.55)}`}},[`&.${m.checked} + .${m.track}`]:{backgroundColor:(e.vars||e).palette[s].main}}}))]})),Fe=P("span",{name:"MuiSwitch",slot:"Track",overridesResolver:(e,s)=>s.track})(({theme:e})=>({height:"100%",width:"100%",borderRadius:14/2,zIndex:-1,transition:e.transitions.create(["opacity","background-color"],{duration:e.transitions.duration.shortest}),backgroundColor:e.vars?e.vars.palette.common.onBackground:`${e.palette.mode==="light"?e.palette.common.black:e.palette.common.white}`,opacity:e.vars?e.vars.opacity.switchTrack:`${e.palette.mode==="light"?.38:.3}`})),Te=P("span",{name:"MuiSwitch",slot:"Thumb",overridesResolver:(e,s)=>s.thumb})(({theme:e})=>({boxShadow:(e.vars||e).shadows[1],backgroundColor:"currentColor",width:20,height:20,borderRadius:"50%"})),Ie=n.forwardRef(function(s,a){const i=Pe({props:s,name:"MuiSwitch"}),{className:r,color:l="primary",edge:p=!1,size:g="medium",sx:c}=i,b=G(i,$e),u=C({},i,{color:l,edge:p,size:g}),h=ze(u),v=t.jsx(Te,{className:h.thumb,ownerState:u});return t.jsxs(Le,{className:D(h.root,r),sx:c,ownerState:u,children:[t.jsx(Re,C({type:"checkbox",icon:v,checkedIcon:v,ref:a,ownerState:u},b,{classes:C({},h,{root:h.switchBase})})),t.jsx(Fe,{className:h.track,ownerState:u})]})}),Ae=Ie;function Be(){const{mapKeys:e}=n.useContext(B),{handleAllErrors:s}=n.useContext(U),[a,i]=n.useState({gender:"",height:"",weight:""}),[r,l]=n.useState(["",""]),[p,g]=n.useState(""),[c,b]=n.useState(null),[u,h]=n.useState(!1),[v,S]=n.useState("cutting"),x=n.useRef(null),F=q(),k=Y();n.useEffect(()=>{var o;(o=x.current)==null||o.focus()},[]);const T=(o,d)=>{let f=ge(o.target.value);f!==void 0&&(typeof f=="number"&&(f=f.toString()),d==="feet"?l([f,r[1]]):d==="inches"?l([r[0],f]):d==="pounds"?g(f):i({...a,[d]:f}))},j=o=>K().diff(o,"year"),I=()=>{F.post("/setup_user/",{...a,birthday:K(c).toISOString()}).then(o=>{o.status===200&&F.post("/setup_user/goal/",{goal_text:v}).then(d=>{d.status===200&&k("/home")}).catch(d=>{s(d)})}).catch(o=>{s(o)})};n.useEffect(()=>{u&&i({...a,height:(Number(r[0])*30.48+Number(r[1])*2.54).toFixed(2),weight:(Number(p)/2.205).toFixed(2)})},[p,r]);const E=async()=>{if(a.gender.length==0||c==null||a.height.length==0||a.weight.length==0){s(e("Please fill in all fields"));return}else if(Number(j(c))>120||Number(j(c))<16||Number(j(c))%1!==0){s(e("Please enter a valid age"));return}else if(Number(a.height)>300||Number(a.height)<100){s(e("Please enter a valid height"));return}else if(Number(a.weight)>300||Number(a.weight)<30){s(e("Please enter a valid weight"));return}I(),k("/home")},z=o=>{if(o.key==="Enter"){o.preventDefault();const d=Array.from(document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')),f=d.indexOf(document.activeElement),A=d[f+1];A&&A.focus()}},N=o=>t.jsx(M,{variant:"outlined",sx:{width:"140px",textTransform:"none",fontWeight:"normal",opacity:a.gender===o?"1":"0.7",borderColor:a.gender===o?"primary.main":"grey.500"},style:{color:"#222",paddingTop:"0",paddingBottom:"0",padding:"0"},onClick:()=>i({...a,gender:o}),children:t.jsxs("div",{className:"flex w-full gap-2 p-2",children:[t.jsx(pe,{isChecked:a.gender===o}),t.jsx("span",{children:e(o)})]})}),w=(o,d,f,A)=>t.jsx("div",{className:"flex items-center mt-2",children:t.jsx(he,{endAdornment:t.jsx(me,{position:"end",children:f}),spellCheck:!1,onKeyDown:z,placeholder:e(d),value:o,onChange:te=>T(te,A),sx:{borderRadius:"4px",px:1,width:"120px",border:"1px solid #ddd","&::before":{transform:"scaleX(0)",left:"2.5px",right:"2.5px",bottom:0,top:"unset",transition:"transform .15s cubic-bezier(0.1,0.9,0.2,1)",borderRadius:0},"&:focus-within::before":{transform:"scaleX(1)"}}})});return t.jsxs(t.Fragment,{children:[t.jsx($,{className:"text-2xl ",children:e("Profile details")}),t.jsxs("div",{className:"flex flex-col w-fit font-robotoSlap",children:[t.jsxs("div",{className:"flex space-x-6 mb-4 mt-2",children:[N("male"),N("female")]}),t.jsx(ke,{control:t.jsx(Ae,{onClick:()=>h(!u),checked:u}),label:e("Imperial units")}),t.jsx("div",{className:"flex space-x-6",children:u?t.jsxs(t.Fragment,{children:[w(r[0],"Height","ft","feet")," ",w(p,"Weight","lb","pounds")]}):t.jsxs(t.Fragment,{children:[w(a.height,"Height","cm","height"),w(a.weight,"Weight","kg","weight")]})}),u&&w(r[1],"Height","in","inches"),t.jsx("div",{className:"h-4"}),t.jsx(de,{components:["DatePicker"],children:t.jsx(ue,{value:c,onChange:o=>{b(o)},sx:{".MuiInputBase-root":{height:"auto",fontSize:"0.875rem"},".MuiInputBase-input":{padding:"16px"}},label:e("Date of Birth")})}),t.jsxs(J,{color:"primary",sx:{mt:2,width:180},size:"small",children:[t.jsx(Q,{id:"demo-select-small-label",children:e("Goal")}),t.jsxs(Z,{id:"demo-select-small",value:v,label:"Nutrients",onChange:o=>{S(o.target.value)},children:[t.jsx(R,{value:"cutting",children:e("lose weight")}),t.jsx(R,{value:"maintenance",children:e("maintain weight")}),t.jsx(R,{value:"bulking",children:e("gain weight")})]})]})]}),t.jsx("div",{className:"ml-auto",children:t.jsx(ee,{onClick:()=>{E()},text:e("Submit")})})]})}function Ee({onSubmit:e}){const{mapKeys:s}=n.useContext(B),{handleAllErrors:a}=n.useContext(U),[i,r]=n.useState("english"),[l,p]=n.useState(!1),g=q(),{hasAccess:c}=n.useContext(_),[b,u]=n.useState(O.tz.guess()),h=O.tz.names();n.useEffect(()=>{c&&v()},[c]);const v=()=>{g.get("/settings/language/").then(x=>{r(x.data)}).catch(x=>{a(x)})};n.useEffect(()=>{l&&g.post("/settings/language/",{language:i}).then(()=>{p(!1),location.reload()}).catch(x=>{a(x)})},[l]);const S=()=>{g.post("/settings/timezone/",{timezone:b}).then(()=>{e()}).catch(x=>{a(x)})};return t.jsxs(t.Fragment,{children:[t.jsx($,{className:"text-2xl",children:s("Set your language")}),t.jsx("div",{className:"flex flex-col w-fit mx-auto text-base font-robotoSlap",children:t.jsxs(J,{color:"primary",sx:{m:1,width:180},size:"small",children:[t.jsx(Q,{id:"demo-select-small-label",children:s("Language")}),t.jsxs(Z,{labelId:"demo-select-small-label",id:"demo-select-small",value:i,label:"Nutrients",onChange:x=>{r(x.target.value),p(!0)},children:[t.jsx(R,{value:"english",children:s("English")}),t.jsx(R,{value:"german",children:s("German")})]})]})}),t.jsx($,{className:"text-2xl",children:s("Set your timezone")}),t.jsx("div",{className:"flex flex-col w-fit mx-auto text-base font-robotoSlap",children:t.jsx(xe,{timezone:b,setTimezone:u,timezones:h})}),t.jsx("div",{className:"flex justify-end px-2 pt-2",children:t.jsx(ee,{onClick:()=>{S()},text:s("Submit")})})]})}function De({onCancel:e,onSubmit:s}){const{mapKeys:a}=n.useContext(B);return t.jsxs("div",{className:"max-w-lg space-y-4",children:[t.jsx("p",{className:"text-base",children:a(`This information is provided for educational purposes only and is not
        intended to be a substitute for professional medical advice, diagnosis,
        or treatment. Always seek the advice of your physician or other
        qualified health provider with any questions you may have regarding a
        medical condition. Never disregard professional medical advice or delay
        in seeking it because of something you have read here. The content
        provided is for general informational purposes and is not intended to be
        a definitive guide or advice.`)}),t.jsxs("div",{className:"flex items-center justify-around",children:[t.jsx("p",{children:a("Do you accept that?")}),t.jsxs("div",{className:"flex space-x-4",children:[t.jsx(M,{onClick:e,variant:"outlined",children:a("No")}),t.jsx(M,{onClick:s,variant:"contained",children:a("Yes")})]})]})]})}function _e(){const e=q(),s=Y(),[a,i]=n.useState(1),{isLoggedIn:r,login:l,refreshed:p}=n.useContext(_),{mapKeys:g}=n.useContext(B),{handleAllErrors:c}=n.useContext(U),{hasAccess:b}=n.useContext(_);n.useEffect(()=>{b&&u()},[b]),n.useEffect(()=>{(async()=>{await l()||s("/login")})()},[r,p]);const u=()=>{e.get("/setup_user/check/").then(h=>{h.data==!0&&s("/home")}).catch(h=>{c(h)})};return t.jsxs("div",{className:"flex flex-col bg-custom w-screen min-h-screen justify-center items-center",children:[t.jsx("div",{id:"overlay"}),t.jsxs(fe,{elevation:3,className:"bright-div px-4 py-6 space-y-4 flex flex-col",children:[t.jsx($,{variant:"h5",className:"text-center mx-auto whitespace-nowrap font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl",children:g("Welcome to Phaero")}),a===1&&t.jsx(Ee,{onSubmit:()=>i(2)}),a===2&&t.jsx(De,{onCancel:()=>s("/"),onSubmit:()=>i(3)}),a===3&&t.jsx(Be,{})]})]})}export{_e as default};