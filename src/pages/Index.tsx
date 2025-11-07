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
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'scheduled' | 'registration';
  assignedRoles: string[];
  voterRoles: string[];
  duration: number;
  registrationDuration: number;
  minVotesThreshold: number;
  keepOldRoles: boolean;
  registrationEndDate?: string;
  endDate: string;
  candidates: Candidate[];
  totalVotes: number;
}

interface CandidateForm {
  name: string;
  avatar: string;
}

const Index = () => {
  const [elections, setElections] = useState<Election[]>([
    {
      id: '1',
      title: 'Модератор Сервера',
      description: 'Выборы главного модератора Discord-сервера на следующий месяц',
      status: 'active',
      assignedRoles: ['@Модератор', '@Старший-Модератор'],
      voterRoles: ['@Участник', '@Проверенный'],
      duration: 30,
      registrationDuration: 7,
      minVotesThreshold: 50,
      keepOldRoles: false,
      endDate: '2025-12-07',
      candidates: [
        { id: 'c1', name: 'AlexDev', avatar: '👨‍💻', votes: 45 },
        { id: 'c2', name: 'SarahMod', avatar: '👩‍💼', votes: 38 },
        { id: 'c3', name: 'MaxPro', avatar: '🧑‍🎨', votes: 27 }
      ],
      totalVotes: 110
    },
    {
      id: '2',
      title: 'Организатор Ивентов',
      description: 'Голосование за организатора еженедельных мероприятий',
      status: 'active',
      assignedRoles: ['@Event-Master'],
      voterRoles: ['@Участник'],
      duration: 14,
      registrationDuration: 3,
      minVotesThreshold: 30,
      keepOldRoles: true,
      endDate: '2025-11-21',
      candidates: [
        { id: 'c4', name: 'PartyKing', avatar: '🎉', votes: 52 },
        { id: 'c5', name: 'GameHost', avatar: '🎮', votes: 41 }
      ],
      totalVotes: 93
    }
  ]);

  const [newElection, setNewElection] = useState({
    title: '',
    description: '',
    assignedRoles: [] as string[],
    voterRoles: [] as string[],
    duration: 30,
    registrationDuration: 7,
    minVotesThreshold: 10,
    keepOldRoles: false
  });

  const [roleInput, setRoleInput] = useState('');
  const [voterRoleInput, setVoterRoleInput] = useState('');
  const [candidateForm, setCandidateForm] = useState<CandidateForm>({ name: '', avatar: '' });
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
      voterRoles: newElection.voterRoles,
      duration: newElection.duration,
      registrationDuration: newElection.registrationDuration,
      minVotesThreshold: newElection.minVotesThreshold,
      keepOldRoles: newElection.keepOldRoles,
      endDate: new Date(Date.now() + newElection.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      candidates: [],
      totalVotes: 0
    };

    setElections(prev => [...prev, election]);
    setNewElection({ 
      title: '', 
      description: '', 
      assignedRoles: [], 
      voterRoles: [], 
      duration: 30,
      registrationDuration: 7,
      minVotesThreshold: 10,
      keepOldRoles: false
    });
    
    toast({
      title: "Выборы созданы!",
      description: "Новые выборы успешно запланированы",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent';
      case 'registration': return 'bg-blue-500';
      case 'completed': return 'bg-muted';
      case 'scheduled': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активно';
      case 'registration': return 'Регистрация';
      case 'completed': return 'Завершено';
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

    if (!editingElectionId) return;

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: candidateForm.name,
      avatar: candidateForm.avatar || '👤',
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

    setCandidateForm({ name: '', avatar: '' });
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

  const startElection = (electionId: string) => {
    const election = elections.find(e => e.id === electionId);
    if (!election || election.candidates.length < 2) {
      toast({
        title: "Ошибка",
        description: "Добавьте минимум 2 кандидатов для запуска выборов",
        variant: "destructive"
      });
      return;
    }

    const registrationEndDate = new Date(Date.now() + election.registrationDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setElections(prev => prev.map(e => 
      e.id === electionId 
        ? { 
            ...e, 
            status: 'registration' as const,
            registrationEndDate,
            endDate: new Date(Date.now() + (election.registrationDuration + election.duration) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        : e
    ));
    
    toast({
      title: "Период регистрации начался!",
      description: `Регистрация кандидатов до ${registrationEndDate}`,
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

                  <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Icon name="Settings" size={16} />
                      Параметры выборов
                    </h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="registrationDuration">Период регистрации кандидатов (дней)</Label>
                      <Input
                        id="registrationDuration"
                        type="number"
                        min="1"
                        value={newElection.registrationDuration}
                        onChange={(e) => setNewElection(prev => ({ ...prev, registrationDuration: parseInt(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">Время для добавления кандидатов перед голосованием</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="duration">Период голосования (дней)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={newElection.duration}
                        onChange={(e) => setNewElection(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">Длительность активного голосования</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="minVotesThreshold">Минимум голосов для признания состоявшимися</Label>
                      <Input
                        id="minVotesThreshold"
                        type="number"
                        min="1"
                        value={newElection.minVotesThreshold}
                        onChange={(e) => setNewElection(prev => ({ ...prev, minVotesThreshold: parseInt(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">Если меньше голосов, выборы не состоятся</p>
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
              {elections.filter(e => e.status === 'active').map((election, index) => (
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
                          <Icon name="Calendar" size={14} />
                          <span className="text-xs">До {election.endDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon name="BarChart3" size={14} />
                          <span className="text-xs">{election.totalVotes} / {election.minVotesThreshold}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name={election.keepOldRoles ? "Shield" : "ShieldOff"} size={14} className={election.keepOldRoles ? "text-green-500" : "text-red-500"} />
                          <span className="text-xs text-muted-foreground">{election.keepOldRoles ? 'Роли остаются' : 'Роли меняются'}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {election.totalVotes < election.minVotesThreshold && (
                      <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <Icon name="AlertCircle" size={16} className="text-orange-500" />
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          Нужно еще {election.minVotesThreshold - election.totalVotes} голосов для признания выборов состоявшимися
                        </p>
                      </div>
                    )}
                    {election.candidates.map((candidate) => {
                      const percentage = election.totalVotes > 0 
                        ? Math.round((candidate.votes / election.totalVotes) * 100) 
                        : 0;
                      
                      return (
                        <div key={candidate.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{candidate.avatar}</div>
                              <div>
                                <div className="font-semibold">{candidate.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {candidate.votes} голосов ({percentage}%)
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleVote(election.id, candidate.id)}
                              className="gap-2"
                            >
                              <Icon name="ThumbsUp" size={16} />
                              Голосовать
                            </Button>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
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
                            <p className="font-medium">{election.registrationDuration} дней</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon name="Clock" size={16} className="text-accent" />
                          <div>
                            <p className="text-xs">Голосование</p>
                            <p className="font-medium">{election.duration} дней</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon name="Target" size={16} className="text-orange-500" />
                          <div>
                            <p className="text-xs">Мин. голосов</p>
                            <p className="font-medium">{election.minVotesThreshold}</p>
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
                            <div key={candidate.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Dialog open={isCandidateDialogOpen && editingElectionId === election.id} onOpenChange={(open) => {
                        setIsCandidateDialogOpen(open);
                        if (open) setEditingElectionId(election.id);
                        else {
                          setEditingElectionId(null);
                          setCandidateForm({ name: '', avatar: '' });
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Icon name="UserPlus" size={16} className="mr-2" />
                            Добавить кандидата
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Добавить кандидата</DialogTitle>
                            <DialogDescription>
                              Укажите имя кандидата и эмодзи (опционально)
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
                            <Button onClick={addCandidate} className="w-full">
                              Добавить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {election.candidates.length >= 2 && (
                        <Button onClick={() => startElection(election.id)} className="flex-1">
                          <Icon name="Play" size={16} className="mr-2" />
                          Запустить выборы
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {elections.filter(e => e.status === 'completed').length === 0 ? (
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
                {elections.filter(e => e.status === 'completed').map((election, index) => (
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
                      {election.totalVotes >= election.minVotesThreshold ? (
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
                            Всего голосов: {election.totalVotes} • Завершено: {election.endDate}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <Icon name="XCircle" size={20} className="text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Выборы не состоялись</p>
                            <p className="text-xs text-muted-foreground">
                              Недостаточно голосов: {election.totalVotes} из {election.minVotesThreshold}
                            </p>
                          </div>
                        </div>
                      )}
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