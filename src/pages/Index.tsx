import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface Candidate {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  speech: string;
  registeredAt: string;
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'registration' | 'voting' | 'completed' | 'failed';
  assignedRoles: string[];
  removedRoles: string[];
  voterRoles: string[];
  candidateRoles: string[];
  duration: number;
  registrationDuration: number;
  minVotesThresholdPercent: number;
  serverMemberCount: number;
  keepOldRoles: boolean;
  autoStart: boolean;
  registrationStartDate?: string;
  registrationEndDate?: string;
  votingStartDate?: string;
  votingEndDate?: string;
  currentWinner?: string;
  registrationAttempts: number;
  candidates: Candidate[];
  totalVotes: number;
}

interface CandidateForm {
  name: string;
  avatar: string;
  speech: string;
}

const Index = () => {
  const [serverMemberCount, setServerMemberCount] = useState(250);

  const [elections, setElections] = useState<Election[]>([
    {
      id: '1',
      title: 'Модератор Сервера',
      description: 'Выборы главного модератора Discord-сервера на следующий месяц',
      status: 'voting',
      assignedRoles: ['@Модератор', '@Старший-Модератор'],
      removedRoles: [],
      voterRoles: ['@Участник', '@Проверенный'],
      candidateRoles: ['@Проверенный'],
      duration: 720,
      registrationDuration: 168,
      minVotesThresholdPercent: 20,
      serverMemberCount: 250,
      keepOldRoles: false,
      autoStart: true,
      registrationStartDate: '2025-11-01T10:00:00',
      registrationEndDate: '2025-11-08T10:00:00',
      votingStartDate: '2025-11-08T10:00:00',
      votingEndDate: '2025-12-07T10:00:00',
      registrationAttempts: 0,
      candidates: [
        { id: 'c1', name: 'AlexDev', avatar: '👨‍💻', votes: 45, speech: 'Буду модерировать честно и справедливо', registeredAt: '2025-11-02T15:30:00' },
        { id: 'c2', name: 'SarahMod', avatar: '👩‍💼', votes: 38, speech: 'Опыт модерации 3 года', registeredAt: '2025-11-03T12:00:00' },
        { id: 'c3', name: 'MaxPro', avatar: '🧑‍🎨', votes: 27, speech: 'Активен 24/7, помогу всем', registeredAt: '2025-11-04T18:45:00' }
      ],
      totalVotes: 110
    },
    {
      id: '2',
      title: 'Организатор Ивентов',
      description: 'Голосование за организатора еженедельных мероприятий',
      status: 'registration',
      assignedRoles: ['@Event-Master'],
      removedRoles: [],
      voterRoles: ['@Участник'],
      candidateRoles: ['@Участник', '@Активист'],
      duration: 336,
      registrationDuration: 72,
      minVotesThresholdPercent: 15,
      serverMemberCount: 250,
      keepOldRoles: true,
      autoStart: true,
      registrationStartDate: '2025-11-06T10:00:00',
      registrationEndDate: '2025-11-09T10:00:00',
      registrationAttempts: 1,
      candidates: [],
      totalVotes: 0
    }
  ]);

  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    assignedRoles: [] as string[],
    removedRoles: [] as string[],
    voterRoles: [] as string[],
    candidateRoles: [] as string[],
    duration: 720,
    registrationDuration: 168,
    minVotesThresholdPercent: 20,
    keepOldRoles: false,
    autoStart: true
  });

  const [roleInput, setRoleInput] = useState('');
  const [removedRoleInput, setRemovedRoleInput] = useState('');
  const [voterRoleInput, setVoterRoleInput] = useState('');
  const [candidateRoleInput, setCandidateRoleInput] = useState('');
  const [candidateForm, setCandidateForm] = useState<CandidateForm>({ name: '', avatar: '', speech: '' });
  const [editingElectionId, setEditingElectionId] = useState<string | null>(null);
  const [isCandidateDialogOpen, setIsCandidateDialogOpen] = useState(false);

  const handleVote = (electionId: string, candidateId: string) => {
    setElections(prev => prev.map(election => {
      if (election.id === electionId) {
        return {
          ...election,
          candidates: election.candidates.map(candidate => 
            candidate.id === candidateId 
              ? { ...candidate, votes: candidate.votes + 1 }
              : candidate
          ),
          totalVotes: election.totalVotes + 1
        };
      }
      return election;
    }));
    
    toast({
      title: "Голос учтён!",
      description: "Ваш голос был успешно засчитан",
    });
  };

  const addAssignedRole = () => {
    if (roleInput.trim() && !newElection.assignedRoles.includes(roleInput.trim())) {
      setNewElection(prev => ({
        ...prev,
        assignedRoles: [...prev.assignedRoles, roleInput.trim()]
      }));
      setRoleInput('');
    }
  };

  const removeAssignedRole = (role: string) => {
    setNewElection(prev => ({
      ...prev,
      assignedRoles: prev.assignedRoles.filter(r => r !== role)
    }));
  };

  const addVoterRole = () => {
    if (voterRoleInput.trim() && !newElection.voterRoles.includes(voterRoleInput.trim())) {
      setNewElection(prev => ({
        ...prev,
        voterRoles: [...prev.voterRoles, voterRoleInput.trim()]
      }));
      setVoterRoleInput('');
    }
  };

  const removeVoterRole = (role: string) => {
    setNewElection(prev => ({
      ...prev,
      voterRoles: prev.voterRoles.filter(r => r !== role)
    }));
  };

  const addRemovedRole = () => {
    if (removedRoleInput.trim() && !newElection.removedRoles.includes(removedRoleInput.trim())) {
      setNewElection(prev => ({
        ...prev,
        removedRoles: [...prev.removedRoles, removedRoleInput.trim()]
      }));
      setRemovedRoleInput('');
    }
  };

  const removeRemovedRole = (role: string) => {
    setNewElection(prev => ({
      ...prev,
      removedRoles: prev.removedRoles.filter(r => r !== role)
    }));
  };

  const addCandidateRole = () => {
    if (candidateRoleInput.trim() && !newElection.candidateRoles.includes(candidateRoleInput.trim())) {
      setNewElection(prev => ({
        ...prev,
        candidateRoles: [...prev.candidateRoles, candidateRoleInput.trim()]
      }));
      setCandidateRoleInput('');
    }
  };

  const removeCandidateRole = (role: string) => {
    setNewElection(prev => ({
      ...prev,
      candidateRoles: prev.candidateRoles.filter(r => r !== role)
    }));
  };

  const createElection = () => {
    if (!newElection.title || newElection.assignedRoles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Укажите название и минимум одну роль для назначения",
        variant: "destructive"
      });
      return;
    }

    const election: Election = {
      id: Date.now().toString(),
      title: newElection.title,
      description: newElection.description,
      status: 'scheduled',
      assignedRoles: newElection.assignedRoles,
      removedRoles: newElection.removedRoles,
      voterRoles: newElection.voterRoles,
      candidateRoles: newElection.candidateRoles,
      duration: newElection.duration,
      registrationDuration: newElection.registrationDuration,
      minVotesThresholdPercent: newElection.minVotesThresholdPercent,
      serverMemberCount,
      keepOldRoles: newElection.keepOldRoles,
      autoStart: newElection.autoStart,
      registrationAttempts: 0,
      candidates: [],
      totalVotes: 0
    };

    setElections(prev => [...prev, election]);
    setNewElection({ 
      title: '', 
      description: '', 
      assignedRoles: [], 
      removedRoles: [],
      voterRoles: [], 
      candidateRoles: [],
      duration: 720,
      registrationDuration: 168,
      minVotesThresholdPercent: 20,
      keepOldRoles: false,
      autoStart: true
    });
    
    toast({
      title: "Выборы созданы!",
      description: "Новые выборы успешно запланированы",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voting': return 'bg-accent';
      case 'registration': return 'bg-blue-500';
      case 'completed': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      case 'scheduled': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'voting': return 'Голосование';
      case 'registration': return 'Регистрация';
      case 'completed': return 'Завершено';
      case 'failed': return 'Не состоялось';
      case 'scheduled': return 'Запланировано';
      default: return status;
    }
  };

  const addCandidate = () => {
    if (!candidateForm.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя кандидата",
        variant: "destructive"
      });
      return;
    }

    if (!candidateForm.speech.trim()) {
      toast({
        title: "Ошибка",
        description: "Предвыборная речь обязательна для кандидата",
        variant: "destructive"
      });
      return;
    }

    if (!editingElectionId) return;

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: candidateForm.name,
      avatar: candidateForm.avatar || '👤',
      speech: candidateForm.speech,
      registeredAt: new Date().toISOString(),
      votes: 0
    };

    setElections(prev => prev.map(election => {
      if (election.id === editingElectionId) {
        return {
          ...election,
          candidates: [...election.candidates, newCandidate]
        };
      }
      return election;
    }));

    setCandidateForm({ name: '', avatar: '', speech: '' });
    setIsCandidateDialogOpen(false);
    
    toast({
      title: "Кандидат добавлен!",
      description: `${newCandidate.name} успешно добавлен в список`,
    });
  };

  const removeCandidate = (electionId: string, candidateId: string) => {
    setElections(prev => prev.map(election => {
      if (election.id === electionId) {
        return {
          ...election,
          candidates: election.candidates.filter(c => c.id !== candidateId)
        };
      }
      return election;
    }));
    
    toast({
      title: "Кандидат удалён",
      description: "Кандидат успешно удалён из списка",
    });
  };

  const startRegistration = (electionId: string) => {
    const election = elections.find(e => e.id === electionId);
    if (!election) return;

    const registrationStartDate = new Date().toISOString();
    const registrationEndDate = new Date(Date.now() + election.registrationDuration * 60 * 60 * 1000).toISOString();

    setElections(prev => prev.map(e => 
      e.id === electionId 
        ? { 
            ...e, 
            status: 'registration' as const,
            registrationStartDate,
            registrationEndDate,
            registrationAttempts: e.registrationAttempts + 1
          }
        : e
    ));
    
    toast({
      title: "Регистрация кандидатов началась!",
      description: `Регистрация до ${new Date(registrationEndDate).toLocaleString('ru-RU')}`,
    });
  };

  const startVoting = (electionId: string) => {
    const election = elections.find(e => e.id === electionId);
    if (!election) return;

    if (election.candidates.length === 0) {
      toast({
        title: "Невозможно начать голосование",
        description: "Нет зарегистрированных кандидатов. Регистрация будет перезапущена.",
        variant: "destructive"
      });
      startRegistration(electionId);
      return;
    }

    const votingStartDate = new Date().toISOString();
    const votingEndDate = new Date(Date.now() + election.duration * 60 * 60 * 1000).toISOString();

    setElections(prev => prev.map(e => 
      e.id === electionId 
        ? { 
            ...e, 
            status: 'voting' as const,
            votingStartDate,
            votingEndDate
          }
        : e
    ));
    
    toast({
      title: "Голосование началось!",
      description: `Голосование до ${new Date(votingEndDate).toLocaleString('ru-RU')}`,
    });
  };

  const completeElection = (electionId: string) => {
    const election = elections.find(e => e.id === electionId);
    if (!election) return;

    const requiredVotes = Math.ceil(election.serverMemberCount * election.minVotesThresholdPercent / 100);
    const winner = election.candidates.sort((a, b) => b.votes - a.votes)[0];

    setElections(prev => prev.map(e => 
      e.id === electionId 
        ? { 
            ...e, 
            status: election.totalVotes >= requiredVotes ? 'completed' as const : 'failed' as const,
            currentWinner: election.totalVotes >= requiredVotes ? winner?.name : undefined
          }
        : e
    ));
    
    if (election.totalVotes >= requiredVotes) {
      toast({
        title: "Выборы завершены!",
        description: `Победитель: ${winner.name} с ${winner.votes} голосами`,
      });
    } else {
      toast({
        title: "Выборы не состоялись",
        description: `Недостаточно голосов: ${election.totalVotes} из ${requiredVotes}`,
        variant: "destructive"
      });
    }
  };

  const forceStage = (electionId: string, stage: Election['status']) => {
    setElections(prev => prev.map(e => 
      e.id === electionId ? { ...e, status: stage } : e
    ));
    toast({
      title: "Стадия изменена",
      description: `Выборы переведены в стадию: ${getStatusText(stage)}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Icon name="Vote" className="text-primary-foreground" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">VoteBot Dashboard</h1>
                <p className="text-muted-foreground">Управление выборами и ролями</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Icon name="Plus" size={20} />
                  Создать выборы
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Новые выборы</DialogTitle>
                  <DialogDescription>
                    Создайте новое голосование для вашего Discord-сервера
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input
                      id="title"
                      placeholder="Модератор сервера"
                      value={newElection.title}
                      onChange={(e) => setNewElection(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Описание</Label>
                    <Input
                      id="description"
                      placeholder="Выборы главного модератора..."
                      value={newElection.description}
                      onChange={(e) => setNewElection(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Роли для назначения победителю *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="@Модератор"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAssignedRole())}
                      />
                      <Button type="button" size="icon" variant="secondary" onClick={addAssignedRole}>
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                    {newElection.assignedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newElection.assignedRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="gap-1 pl-3 pr-1 py-1">
                            {role}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-destructive/20"
                              onClick={() => removeAssignedRole(role)}
                            >
                              <Icon name="X" size={12} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Роли для удаления у проигравших</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="@Старый-Модератор"
                        value={removedRoleInput}
                        onChange={(e) => setRemovedRoleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRemovedRole())}
                      />
                      <Button type="button" size="icon" variant="secondary" onClick={addRemovedRole}>
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                    {newElection.removedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newElection.removedRoles.map((role) => (
                          <Badge key={role} variant="destructive" className="gap-1 pl-3 pr-1 py-1">
                            {role}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-destructive/20"
                              onClick={() => removeRemovedRole(role)}
                            >
                              <Icon name="X" size={12} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Роли участников для голосования</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="@Участник"
                        value={voterRoleInput}
                        onChange={(e) => setVoterRoleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVoterRole())}
                      />
                      <Button type="button" size="icon" variant="secondary" onClick={addVoterRole}>
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                    {newElection.voterRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newElection.voterRoles.map((role) => (
                          <Badge key={role} variant="outline" className="gap-1 pl-3 pr-1 py-1">
                            {role}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-destructive/20"
                              onClick={() => removeVoterRole(role)}
                            >
                              <Icon name="X" size={12} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Роли для выдвижения кандидатов</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="@Проверенный"
                        value={candidateRoleInput}
                        onChange={(e) => setCandidateRoleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCandidateRole())}
                      />
                      <Button type="button" size="icon" variant="secondary" onClick={addCandidateRole}>
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                    {newElection.candidateRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newElection.candidateRoles.map((role) => (
                          <Badge key={role} variant="default" className="gap-1 pl-3 pr-1 py-1">
                            {role}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 p-0 hover:bg-destructive/20"
                              onClick={() => removeCandidateRole(role)}
                            >
                              <Icon name="X" size={12} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Icon name="Settings" size={16} />
                      Параметры выборов
                    </h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="registrationDuration">Период регистрации кандидатов (часов)</Label>
                      <Input
                        id="registrationDuration"
                        type="number"
                        min="1"
                        value={newElection.registrationDuration}
                        onChange={(e) => setNewElection(prev => ({ ...prev, registrationDuration: parseInt(e.target.value) || 1 }))}
                      />
                      <p className="text-xs text-muted-foreground">Время для добавления кандидатов перед голосованием</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="duration">Период голосования (часов)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={newElection.duration}
                        onChange={(e) => setNewElection(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                      />
                      <p className="text-xs text-muted-foreground">Длительность активного голосования</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="minVotesThresholdPercent">Минимум голосов от участников сервера (%)</Label>
                      <Input
                        id="minVotesThresholdPercent"
                        type="number"
                        min="1"
                        max="100"
                        value={newElection.minVotesThresholdPercent}
                        onChange={(e) => setNewElection(prev => ({ ...prev, minVotesThresholdPercent: parseInt(e.target.value) || 1 }))}
                      />
                      <p className="text-xs text-muted-foreground">Процент участников сервера (без ботов), которые должны проголосовать</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="autoStart">Автоматический запуск выборов</Label>
                        <p className="text-xs text-muted-foreground">Бот сам откроет регистрацию и голосование</p>
                      </div>
                      <input
                        id="autoStart"
                        type="checkbox"
                        checked={newElection.autoStart}
                        onChange={(e) => setNewElection(prev => ({ ...prev, autoStart: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="keepOldRoles">Сохранять старые роли до назначения нового</Label>
                        <p className="text-xs text-muted-foreground">Предыдущий владелец роли не потеряет её сразу</p>
                      </div>
                      <input
                        id="keepOldRoles"
                        type="checkbox"
                        checked={newElection.keepOldRoles}
                        onChange={(e) => setNewElection(prev => ({ ...prev, keepOldRoles: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={createElection} className="w-full">
                  Создать выборы
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="active">Активные</TabsTrigger>
            <TabsTrigger value="scheduled">Запланированные</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {elections.filter(e => e.status === 'voting' || e.status === 'registration').map((election, index) => (
                <Card key={election.id} className="animate-scale-in border-2" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">{election.title}</CardTitle>
                        <CardDescription>{election.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(election.status)}>
                        {getStatusText(election.status)}
                      </Badge>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Award" size={16} className="text-primary" />
                        <span className="text-muted-foreground">Назначаемые роли:</span>
                        <div className="flex flex-wrap gap-1">
                          {election.assignedRoles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                          ))}
                        </div>
                      </div>
                      {election.voterRoles.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Users" size={16} className="text-accent" />
                          <span className="text-muted-foreground">Могут голосовать:</span>
                          <div className="flex flex-wrap gap-1">
                            {election.voterRoles.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon name="Clock" size={14} />
                          <span className="text-xs">{Math.round(election.duration / 24)}д {election.duration % 24}ч</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon name="BarChart3" size={14} />
                          <span className="text-xs">{election.totalVotes} / {Math.ceil(election.serverMemberCount * election.minVotesThresholdPercent / 100)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name={election.keepOldRoles ? "Shield" : "ShieldOff"} size={14} className={election.keepOldRoles ? "text-green-500" : "text-red-500"} />
                          <span className="text-xs text-muted-foreground">{election.keepOldRoles ? 'Роли остаются' : 'Роли меняются'}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const requiredVotes = Math.ceil(election.serverMemberCount * election.minVotesThresholdPercent / 100);
                      return election.totalVotes < requiredVotes && (
                        <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <Icon name="AlertCircle" size={16} className="text-orange-500" />
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            Нужно еще {requiredVotes - election.totalVotes} голосов для признания выборов состоявшимися ({election.minVotesThresholdPercent}% от {election.serverMemberCount} участников)
                          </p>
                        </div>
                      );
                    })()}
                    {election.status === 'registration' && (
                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <Icon name="UserPlus" size={16} className="text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Регистрация кандидатов</p>
                          <p className="text-xs text-muted-foreground">
                            {election.candidates.length} кандидатов • Попытка #{election.registrationAttempts}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => startVoting(election.id)} disabled={election.candidates.length === 0}>
                          <Icon name="Play" size={14} className="mr-1" />
                          Запустить голосование
                        </Button>
                      </div>
                    )}
                    {election.candidates.map((candidate) => {
                      const percentage = election.totalVotes > 0 
                        ? Math.round((candidate.votes / election.totalVotes) * 100) 
                        : 0;
                      
                      return (
                        <div key={candidate.id} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{candidate.avatar}</div>
                              <div>
                                <div className="font-semibold">{candidate.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {election.status === 'voting' ? `${candidate.votes} голосов (${percentage}%)` : `Зарегистрирован ${new Date(candidate.registeredAt).toLocaleDateString('ru-RU')}`}
                                </div>
                              </div>
                            </div>
                            {election.status === 'voting' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleVote(election.id, candidate.id)}
                                className="gap-2"
                              >
                                <Icon name="ThumbsUp" size={16} />
                                Голосовать
                              </Button>
                            )}
                          </div>
                          {candidate.speech && (
                            <p className="text-sm text-muted-foreground italic pl-12">"{candidate.speech}"</p>
                          )}
                          {election.status === 'voting' && <Progress value={percentage} className="h-2" />}
                        </div>
                      );
                    })}
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Icon name="Settings" size={16} />
                        Администрирование
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {election.status === 'registration' && (
                          <Button size="sm" variant="outline" onClick={() => startVoting(election.id)}>
                            <Icon name="Play" size={14} className="mr-1" />
                            Начать голосование
                          </Button>
                        )}
                        {election.status === 'voting' && (
                          <Button size="sm" variant="outline" onClick={() => completeElection(election.id)}>
                            <Icon name="CheckCircle" size={14} className="mr-1" />
                            Завершить
                          </Button>
                        )}
                        <Dialog open={isCandidateDialogOpen && editingElectionId === election.id} onOpenChange={(open) => {
                          setIsCandidateDialogOpen(open);
                          if (open) setEditingElectionId(election.id);
                          else {
                            setEditingElectionId(null);
                            setCandidateForm({ name: '', avatar: '', speech: '' });
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Icon name="UserPlus" size={14} className="mr-1" />
                              Добавить кандидата
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Добавить кандидата</DialogTitle>
                              <DialogDescription>
                                Укажите имя кандидата и предвыборную речь
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <Label htmlFor="candidate-name">Имя кандидата</Label>
                                <Input
                                  id="candidate-name"
                                  placeholder="Например: Иван Петров"
                                  value={candidateForm.name}
                                  onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="candidate-avatar">Эмодзи (опционально)</Label>
                                <Input
                                  id="candidate-avatar"
                                  placeholder="👤"
                                  value={candidateForm.avatar}
                                  onChange={(e) => setCandidateForm(prev => ({ ...prev, avatar: e.target.value }))}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="candidate-speech">Предвыборная речь *</Label>
                                <textarea
                                  id="candidate-speech"
                                  placeholder="Расскажите, почему вы достойны этой роли..."
                                  value={candidateForm.speech}
                                  onChange={(e) => setCandidateForm(prev => ({ ...prev, speech: e.target.value }))}
                                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                              </div>
                              <Button onClick={addCandidate} className="w-full">
                                Добавить
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="destructive" onClick={() => forceStage(election.id, 'failed')}>
                          <Icon name="XCircle" size={14} className="mr-1" />
                          Отменить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {elections.filter(e => e.status === 'scheduled').map((election, index) => (
                <Card key={election.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">{election.title}</CardTitle>
                        <CardDescription>{election.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(election.status)}>
                        {getStatusText(election.status)}
                      </Badge>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Award" size={16} className="text-primary" />
                        <span className="text-muted-foreground">Назначаемые роли:</span>
                        <div className="flex flex-wrap gap-1">
                          {election.assignedRoles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                          ))}
                        </div>
                      </div>
                      {election.voterRoles.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Users" size={16} className="text-accent" />
                          <span className="text-muted-foreground">Могут голосовать:</span>
                          <div className="flex flex-wrap gap-1">
                            {election.voterRoles.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon name="UserPlus" size={16} className="text-blue-500" />
                          <div>
                            <p className="text-xs">Регистрация</p>
                            <p className="font-medium">{election.registrationDuration}ч ({Math.round(election.registrationDuration / 24)}д)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon name="Clock" size={16} className="text-accent" />
                          <div>
                            <p className="text-xs">Голосование</p>
                            <p className="font-medium">{election.duration}ч ({Math.round(election.duration / 24)}д)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon name="Target" size={16} className="text-orange-500" />
                          <div>
                            <p className="text-xs">Мин. голосов</p>
                            <p className="font-medium">{election.minVotesThresholdPercent}% ({Math.ceil(election.serverMemberCount * election.minVotesThresholdPercent / 100)})</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon name={election.keepOldRoles ? "Shield" : "ShieldOff"} size={16} className={election.keepOldRoles ? "text-green-500" : "text-red-500"} />
                          <div>
                            <p className="text-xs">Старые роли</p>
                            <p className="font-medium">{election.keepOldRoles ? 'Сохраняются' : 'Удаляются'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {election.candidates.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Icon name="Info" size={16} />
                        <span>Добавьте кандидатов для запуска выборов</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Кандидаты ({election.candidates.length}):</p>
                        <div className="space-y-2">
                          {election.candidates.map((candidate) => (
                            <div key={candidate.id} className="p-3 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{candidate.avatar}</span>
                                  <span className="font-medium">{candidate.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCandidate(election.id, candidate.id)}
                                >
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </div>
                              {candidate.speech && (
                                <p className="text-sm text-muted-foreground italic pl-11">"{candidate.speech}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button onClick={() => startRegistration(election.id)} className="w-full">
                      <Icon name="Play" size={16} className="mr-2" />
                      Начать регистрацию
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {elections.filter(e => e.status === 'completed' || e.status === 'failed').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Icon name="Archive" size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">История выборов пуста</h3>
                  <p className="text-muted-foreground">
                    Завершённые выборы будут отображаться здесь
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {elections.filter(e => e.status === 'completed' || e.status === 'failed').map((election, index) => (
                  <Card key={election.id} className="animate-scale-in opacity-70" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl">{election.title}</CardTitle>
                          <CardDescription>{election.description}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(election.status)}>
                          {getStatusText(election.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const requiredVotes = Math.ceil(election.serverMemberCount * election.minVotesThresholdPercent / 100);
                        return election.totalVotes >= requiredVotes ? (
                        <div className="space-y-2">
                          {election.candidates.sort((a, b) => b.votes - a.votes).map((candidate, idx) => {
                            const percentage = election.totalVotes > 0 
                              ? Math.round((candidate.votes / election.totalVotes) * 100) 
                              : 0;
                            return (
                              <div key={candidate.id} className={`p-3 rounded-lg ${idx === 0 ? 'bg-accent/30 border-2 border-accent' : 'bg-muted'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    {idx === 0 && <Icon name="Crown" size={20} className="text-yellow-500" />}
                                    <span className="text-2xl">{candidate.avatar}</span>
                                    <span className="font-medium">{candidate.name}</span>
                                  </div>
                                  <span className="text-sm font-semibold">{percentage}%</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            Всего голосов: {election.totalVotes} • Завершено: {new Date(election.endDate).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <Icon name="XCircle" size={20} className="text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Выборы не состоялись</p>
                            <p className="text-xs text-muted-foreground">
                              Недостаточно голосов: {election.totalVotes} из {requiredVotes} ({election.minVotesThresholdPercent}% от {election.serverMemberCount} участников)
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;