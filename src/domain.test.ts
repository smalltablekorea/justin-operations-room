import { describe, expect, it } from 'vitest';
import { createWork, transitionWork } from './domain';

describe('업무 생명주기', () => {
  it('새 업무를 대기열에 넣고 감사 이력을 남긴다', () => {
    const result = createWork({title:'미수금 확인',description:'이번 주 미수금 정리',mode:'draft',dueAt:'2026-11-08'});
    expect(result.work.status).toBe('queued');
    expect(result.audit.action).toBe('work.created');
    expect(result.audit.workId).toBe(result.work.id);
  });

  it('외부 실행 업무는 승인 없이 완료할 수 없다', () => {
    const {work}=createWork({title:'고객 문자',description:'공정 안내 발송',mode:'approval',dueAt:'2026-11-08'});
    expect(()=>transitionWork(work,'completed')).toThrow(/승인/);
  });

  it('승인하면 실행 대기 상태와 감사 이력을 만든다', () => {
    const {work}=createWork({title:'고객 문자',description:'공정 안내 발송',mode:'approval',dueAt:'2026-11-08'});
    const started=transitionWork(work,'in_progress').work;
    const waiting=transitionWork(started,'waiting_approval').work;
    const approved=transitionWork(waiting,'approved');
    expect(approved.work.status).toBe('approved');
    expect(approved.audit.action).toBe('work.approved');
  });
});
