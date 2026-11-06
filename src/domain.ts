export type WorkStatus='queued'|'in_progress'|'waiting_approval'|'approved'|'revision_requested'|'completed';
export type WorkMode='draft'|'approval'|'continuous';
export type WorkInput={title:string;description:string;mode:WorkMode;dueAt:string};
export type Work={id:string;title:string;description:string;mode:WorkMode;status:WorkStatus;dueAt:string;createdAt:string;updatedAt:string;owner:string;channel?:string;output?:string};
export type AuditAction='work.created'|'work.started'|'work.submitted'|'work.approved'|'work.revision_requested'|'work.completed';
export type Audit={id:string;workId:string;action:AuditAction;actor:string;at:string;note:string};
const uid=()=>globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const now=()=>new Date().toISOString();
const actionByStatus:Record<WorkStatus,AuditAction>={queued:'work.created',in_progress:'work.started',waiting_approval:'work.submitted',approved:'work.approved',revision_requested:'work.revision_requested',completed:'work.completed'};
const noteByStatus:Record<WorkStatus,string>={queued:'업무가 접수되었습니다.',in_progress:'AI 실행을 시작했습니다.',waiting_approval:'대표님의 승인을 기다립니다.',approved:'대표님이 실행을 승인했습니다.',revision_requested:'수정 요청을 접수했습니다.',completed:'업무 실행을 완료했습니다.'};
export function createWork(input:WorkInput){const at=now();const work:Work={...input,id:uid(),status:'queued',createdAt:at,updatedAt:at,owner:'저스틴'};return {work,audit:makeAudit(work,'work.created','대표님','업무를 새로 위임했습니다.')};}
function makeAudit(work:Work,action:AuditAction,actor='저스틴',note=''):Audit{return{id:uid(),workId:work.id,action,actor,at:now(),note};}
const allowed:Record<WorkStatus,WorkStatus[]>={queued:['in_progress'],in_progress:['waiting_approval','completed'],waiting_approval:['approved','revision_requested'],approved:['completed'],revision_requested:['in_progress'],completed:[]};
export function transitionWork(work:Work,next:WorkStatus,note=''){
 if(work.mode==='approval'&&next==='completed'&&work.status!=='approved')throw new Error('외부 실행 업무는 대표님의 승인 후 완료할 수 있습니다.');
 if(!allowed[work.status].includes(next))throw new Error(`${work.status}에서 ${next}(으)로 변경할 수 없습니다.`);
 const updated={...work,status:next,updatedAt:now()};
 return{work:updated,audit:makeAudit(updated,actionByStatus[next],next==='approved'?'대표님':'저스틴',note||noteByStatus[next])};
}
export const statusLabel:Record<WorkStatus,string>={queued:'대기',in_progress:'실행 중',waiting_approval:'승인 대기',approved:'승인됨',revision_requested:'수정 중',completed:'완료'};
export const actionLabel:Record<AuditAction,string>={'work.created':'업무 생성','work.started':'실행 시작','work.submitted':'승인 요청','work.approved':'실행 승인','work.revision_requested':'수정 요청','work.completed':'실행 완료'};
