'use client';

import { Clock, TrendingUp, Flame, Zap } from 'lucide-react';
import { Card } from '@/app/components/ui';
import { useTranslation } from '@/app/hooks/useTranslation';

interface QuickStatsProps {
  completedTasks: number;
  totalTasks: number;
  workTimeHours: number;
  workTimeMinutes: number;
  monthlyExpense: number;
  activeGoalsCount: number;
}

export default function QuickStats({
  completedTasks,
  totalTasks,
  workTimeHours,
  workTimeMinutes,
  monthlyExpense,
  activeGoalsCount
}: QuickStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-[fadeIn_0.7s_ease-out]">
      <Card hover glow padding="md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-900/30">
            <Zap size={20} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.tasks')}</p>
            <p className="text-xl font-bold text-white">
              {completedTasks}<span className="text-gray-500 text-sm font-normal">/{totalTasks}</span>
            </p>
          </div>
        </div>
      </Card>

      <Card hover glow padding="md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-900/30">
            <Clock size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.workTime')}</p>
            <p className="text-xl font-bold text-white">
              {workTimeHours}h <span className="text-gray-500 text-sm font-normal">{workTimeMinutes}m</span>
            </p>
          </div>
        </div>
      </Card>

      <Card hover glow padding="md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-900/30">
            <TrendingUp size={20} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.expense')}</p>
            <p className="text-xl font-bold text-white">₺{monthlyExpense}</p>
          </div>
        </div>
      </Card>

      <Card hover glow padding="md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-900/30">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.activeGoals')}</p>
            <p className="text-xl font-bold text-white">{activeGoalsCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
