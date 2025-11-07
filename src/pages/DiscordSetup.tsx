import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

export default function DiscordSetup() {
  const [applicationId, setApplicationId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const registerCommands = async () => {
    if (!applicationId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите Application ID",
        variant: "destructive"
      });
      return;
    }

    if (!botToken.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите Bot Token",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `https://discord.com/api/v10/applications/${applicationId}/commands`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: "vote",
            description: "Управление выборами на сервере",
            options: [
              {
                name: "info",
                description: "Информация о текущих выборах",
                type: 1
              },
              {
                name: "register",
                description: "Выдвинуть свою кандидатуру",
                type: 1,
                options: [
                  {
                    name: "speech",
                    description: "Ваша предвыборная речь",
                    type: 3,
                    required: true
                  }
                ]
              },
              {
                name: "withdraw",
                description: "Снять свою кандидатуру",
                type: 1
              },
              {
                name: "cast",
                description: "Проголосовать за кандидата",
                type: 1,
                options: [
                  {
                    name: "candidate",
                    description: "Выберите кандидата",
                    type: 6,
                    required: true
                  }
                ]
              },
              {
                name: "list",
                description: "Список всех кандидатов",
                type: 1
              }
            ]
          })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, data });
        toast({
          title: "✅ Успешно!",
          description: "Команда /vote зарегистрирована. Теперь она доступна на всех серверах с вашим ботом."
        });
      } else {
        setResult({ success: false, error: data });
        toast({
          title: "❌ Ошибка",
          description: data.message || "Не удалось зарегистрировать команды",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
      toast({
        title: "❌ Ошибка сети",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🤖 Настройка Discord Бота</h1>
          <p className="text-gray-600">Регистрация slash-команд для бота выборов</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Регистрация команды /vote</CardTitle>
            <CardDescription>
              Введите данные вашего Discord приложения для регистрации команд бота
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appId">Application ID</Label>
              <Input
                id="appId"
                placeholder="1234567890123456789"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Discord Developer Portal → ваше приложение → General Information → Application ID
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Bot Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="MTk4NjIyNDgzNDcxOTI1MjQ4.GK7ctC..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Discord Developer Portal → ваше приложение → Bot → Token
              </p>
            </div>

            <Button 
              onClick={registerCommands} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="Send" className="mr-2 h-4 w-4" />
                  Зарегистрировать команды
                </>
              )}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <Icon 
                  name={result.success ? "CheckCircle2" : "XCircle"} 
                  className="h-4 w-4" 
                />
                <AlertDescription>
                  {result.success ? (
                    <div>
                      <p className="font-semibold mb-2">Команды успешно зарегистрированы!</p>
                      <p className="text-sm">Теперь на вашем Discord сервере доступна команда <code>/vote</code> с подкомандами:</p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li>/vote info - информация о выборах</li>
                        <li>/vote register - выдвинуть кандидатуру</li>
                        <li>/vote withdraw - снять кандидатуру</li>
                        <li>/vote cast - проголосовать</li>
                        <li>/vote list - список кандидатов</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold mb-2">Ошибка регистрации</p>
                      <pre className="text-xs bg-black/10 p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 Инструкция</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">1. Получите Application ID:</h3>
              <p className="text-gray-600">
                Откройте <a href="https://discord.com/developers/applications" target="_blank" className="text-blue-600 underline">Discord Developer Portal</a> → 
                выберите приложение → <strong>General Information</strong> → скопируйте <strong>Application ID</strong>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">2. Получите Bot Token:</h3>
              <p className="text-gray-600">
                В том же приложении → <strong>Bot</strong> → нажмите <strong>Reset Token</strong> → скопируйте токен
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">3. Зарегистрируйте команды:</h3>
              <p className="text-gray-600">
                Вставьте Application ID и Bot Token в форму выше и нажмите кнопку
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">4. Проверьте на сервере:</h3>
              <p className="text-gray-600">
                Откройте Discord → ваш сервер → начните вводить <code>/vote</code> в чат
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a 
            href="/"
            className="text-blue-600 hover:underline inline-flex items-center gap-2"
          >
            <Icon name="ArrowLeft" className="h-4 w-4" />
            Вернуться к дашборду выборов
          </a>
        </div>
      </div>
    </div>
  );
}
