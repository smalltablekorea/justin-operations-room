import {createContext,useContext,useEffect,useMemo,useReducer,type ReactNode} from 'react';
import {createWork,transitionWork,type Audit,type Work,type WorkInput,type WorkStatus} from './domain';
type State={works:Work[];audits:Audit[]};
const seedInputs:WorkInput[]=[
 {title:'퍼스트월드 공정 안내 발송',description:'내일 목공 시작 일정과 현장 출입 안내를 고객에게 보냅니다.',mode:'approval',dueAt:'2026-11-07T10:00'},
 {title:'르엘 추가공사 견적 확정',description:'붙박이장 내부 변경 2건, 예상 추가금 320만원을 확인합니다.',mode:'approval',dueAt:'2026-11-07T14:00'},
 {title:'이번 주 현장 기록 게시',description:'공정 전후 사진 8장과 설명 초안을 블로그에 게시합니다.',mode:'approval',dueAt:'2026-11-07T18:00'},
 {title:'신규 문의 분류',description:'47평 전체 리모델링 상담을 견적 단계로 연결합니다.',mode:'draft',dueAt:'2026-11-08T12:00'}];
function seed():State{const pairs=seedInputs.map(createWork);let state:State={works:pairs.map(x=>x.work),audits:pairs.map(x=>x.audit)};state.works=state.works.map((w,i)=>{if(i<3){const a=transitionWork(w,'in_progress');const b=transitionWork(a.work,'waiting_approval');state.audits.push(a.audit,b.audit);return b.work}const a=transitionWork(w,'in_progress');state.audits.push(a.audit);return a.work});return state;}
type Action={type:'create';input:WorkInput}|{type:'transition';id:string;next:WorkStatus;note?:string}|{type:'reset'};
function reducer(state:State,action:Action):State{if(action.type==='reset')return seed();if(action.type==='create'){const x=createWork(action.input);return{works:[x.work,...state.works],audits:[x.audit,...state.audits]}}const old=state.works.find(w=>w.id===action.id);if(!old)return state;const x=transitionWork(old,action.next,action.note);return{works:state.works.map(w=>w.id===action.id?x.work:w),audits:[x.audit,...state.audits]};}
const Ctx=createContext<null|{state:State;create:(i:WorkInput)=>void;move:(id:string,n:WorkStatus,note?:string)=>void;reset:()=>void}>(null);
export function OperationsProvider({children}:{children:ReactNode}){const [state,dispatch]=useReducer(reducer,undefined,()=>{try{const x=localStorage.getItem('justin-ops-v2');return x?JSON.parse(x):seed()}catch{return seed()}});useEffect(()=>localStorage.setItem('justin-ops-v2',JSON.stringify(state)),[state]);const value=useMemo(()=>({state,create:(input:WorkInput)=>dispatch({type:'create',input}),move:(id:string,next:WorkStatus,note?:string)=>dispatch({type:'transition',id,next,note}),reset:()=>dispatch({type:'reset'})}),[state]);return <Ctx.Provider value={value}>{children}</Ctx.Provider>}
export function useOperations(){const x=useContext(Ctx);if(!x)throw new Error('OperationsProvider missing');return x;}
