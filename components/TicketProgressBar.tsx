import React from 'react';
import { MaintenanceTicket, MaintenanceTicketStatus, getTicketProgressSteps } from '../maintenanceStorage';

interface TicketProgressBarProps {
  ticket: MaintenanceTicket;
  onStatusChange?: (newStatus: MaintenanceTicketStatus) => void;
  interactive?: boolean;
  compact?: boolean;
}

const TicketProgressBar: React.FC<TicketProgressBarProps> = ({
  ticket,
  onStatusChange,
  interactive = true,
  compact = false
}) => {
  const { steps, percentage, currentStepIndex } = getTicketProgressSteps(ticket);

  const handleStepClick = (stepKey: MaintenanceTicketStatus) => {
    if (!interactive || !onStatusChange) return;
    onStatusChange(stepKey);
  };

  return (
    <div className={`w-full ${compact ? 'py-2' : 'py-4'}`}>
      {/* Progress Bar Header Info */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
            Progress Tracking
          </span>
          <span className="text-[10px] font-black text-primary uppercase tracking-wider">
            ({percentage}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${
            ticket.status === 'COMPLETED' 
              ? 'bg-emerald-400' 
              : ticket.status === 'IN_PROGRESS' 
                ? 'bg-primary animate-pulse' 
                : 'bg-amber-400'
          }`} />
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            ticket.status === 'COMPLETED' 
              ? 'text-emerald-400' 
              : ticket.status === 'IN_PROGRESS' 
                ? 'text-primary' 
                : 'text-amber-400'
          }`}>
            {ticket.status === 'ASSIGNED' && 'Step 1: Assigned'}
            {ticket.status === 'IN_PROGRESS' && 'Step 2: In Progress'}
            {ticket.status === 'COMPLETED' && 'Step 3: Completed'}
          </span>
        </div>
      </div>

      {/* Progress Bar Graphic */}
      <div className="relative pt-2 pb-6 px-3">
        {/* Background Track Line */}
        <div className="absolute top-7 left-8 right-8 h-1 bg-white/10 rounded-full z-0 overflow-hidden">
          {/* Active Fill Line */}
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(19,236,218,0.6)]"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 3 Step Nodes */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, idx) => {
            const isCompleted = step.completed;
            const isCurrent = step.active;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div 
                key={step.key} 
                className="flex flex-col items-center text-center cursor-pointer group"
                onClick={() => handleStepClick(step.key)}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                title={interactive ? `Click to switch status to ${step.name}` : undefined}
              >
                {/* Node Circle */}
                <div className="relative mb-2">
                  {/* Ping Animation for Active Node */}
                  {isCurrent && (
                    <div className="absolute -inset-1 rounded-full bg-primary/30 animate-ping" />
                  )}

                  <div 
                    className={`size-10 rounded-full flex items-center justify-center transition-all duration-300 relative border-2 ${
                      isCompleted && !isCurrent
                        ? 'bg-primary text-background-dark border-primary shadow-[0_0_14px_rgba(19,236,218,0.4)] scale-95'
                        : isCurrent
                          ? 'bg-primary text-background-dark border-white font-black scale-110 shadow-[0_0_20px_rgba(19,236,218,0.6)] ring-4 ring-primary/20'
                          : 'bg-[#0f1716] border-white/15 text-white/30 group-hover:border-white/30 group-hover:text-white/60'
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <span className="material-symbols-outlined text-lg font-black">check</span>
                    ) : isCurrent ? (
                      <span className="material-symbols-outlined text-lg font-black animate-pulse">
                        {step.key === 'IN_PROGRESS' ? 'engineering' : step.key === 'COMPLETED' ? 'task_alt' : 'assignment_ind'}
                      </span>
                    ) : (
                      <span className="text-xs font-black">{idx + 1}</span>
                    )}
                  </div>
                </div>

                {/* Step Name */}
                <div className="max-w-[85px]">
                  <p className={`text-[11px] font-black uppercase tracking-tight italic leading-tight transition-colors ${
                    isCurrent 
                      ? 'text-primary drop-shadow-[0_0_8px_rgba(19,236,218,0.4)]' 
                      : isCompleted 
                        ? 'text-white' 
                        : 'text-white/40'
                  }`}>
                    {step.name}
                  </p>

                  {/* Timestamp / Details Subtext */}
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5 truncate">
                    {step.timestamp ? step.timestamp.replace('Today, ', '') : (isPending ? 'Pending' : '')}
                  </p>

                  {/* Micro indicator badge */}
                  {isCurrent && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-[8px] font-black uppercase tracking-widest text-primary">
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Quick Advancement Controls */}
      {interactive && onStatusChange && (
        <div className="mt-1 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-primary">touch_app</span>
            <span>Tap step or action below</span>
          </div>

          <div className="flex gap-2">
            {ticket.status === 'ASSIGNED' && (
              <button
                type="button"
                id={`btn-start-work-${ticket.id}`}
                onClick={() => onStatusChange('IN_PROGRESS')}
                className="px-3 py-1.5 bg-primary text-background-dark rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm font-black">play_arrow</span>
                <span>Start Job</span>
              </button>
            )}

            {ticket.status === 'IN_PROGRESS' && (
              <>
                <button
                  type="button"
                  id={`btn-revert-assigned-${ticket.id}`}
                  onClick={() => onStatusChange('ASSIGNED')}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  title="Revert back to Assigned"
                >
                  Back
                </button>
                <button
                  type="button"
                  id={`btn-complete-work-${ticket.id}`}
                  onClick={() => onStatusChange('COMPLETED')}
                  className="px-3 py-1.5 bg-emerald-400 text-background-dark rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-400/20 active:scale-95 transition-all font-black"
                >
                  <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                  <span>Mark Complete</span>
                </button>
              </>
            )}

            {ticket.status === 'COMPLETED' && (
              <button
                type="button"
                id={`btn-reopen-work-${ticket.id}`}
                onClick={() => onStatusChange('IN_PROGRESS')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                <span>Reopen / Edit</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketProgressBar;
