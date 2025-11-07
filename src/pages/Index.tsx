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
  status: 'active' | 'completed' | 'scheduled';
  role: string;
  duration: number;
  endDate: string;
  candidates: Candidate[];
  totalVotes: number;
}

const Index = () => {
  const [elections, setElections] = useState<Election[]>([
    {
      id: '1',
      title: 'Модератор Сервера',
      description: 'Выборы главного модератора Discord-сервера на следующий месяц',
      status: 'active',
      role: '@Модератор',
      duration: 30,
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
      role: '@Event-Master',
      duration: 14,
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
    role: '',
    duration: 30
  });

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

  const createElection = () => {
    if (!newElection.title || !newElection.role) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive"
      });
      return;
    }

    const election: Election = {
      id: Date.now().toString(),
      title: newElection.title,
      description: newElection.description,
      status: 'scheduled',
      role: newElection.role,
      duration: newElection.duration,
      endDate: new Date(Date.now() + newElection.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      candidates: [],
      totalVotes: 0
    };

    setElections(prev => [...prev, election]);
    setNewElection({ title: '', description: '', role: '', duration: 30 });
    
    toast({
      title: "Выборы созданы!",
      description: "Новые выборы успешно запланированы",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent';
      case 'completed': return 'bg-muted';
      case 'scheduled': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активно';
      case 'completed': return 'Завершено';
      case 'scheduled': return 'Запланировано';
      default: return status;
    }
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
                <div className="grid gap-4 py-4">
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
                    <Label htmlFor="role">Роль Discord *</Label>
                    <Input
                      id="role"
                      placeholder="@Модератор"
                      value={newElection.role}
                      onChange={(e) => setNewElection(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Период действия (дней)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={newElection.duration}
                      onChange={(e) => setNewElection(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
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
                    <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Award" size={16} />
                        <span>{election.role}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={16} />
                        <span>До {election.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Users" size={16} />
                        <span>{election.totalVotes} голосов</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                    <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Award" size={16} />
                        <span>{election.role}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={16} />
                        <span>{election.duration} дней</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Info" size={16} />
                      <span>Добавьте кандидатов для запуска выборов</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Icon name="Archive" size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">История выборов пуста</h3>
                <p className="text-muted-foreground">
                  Завершённые выборы будут отображаться здесь
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
