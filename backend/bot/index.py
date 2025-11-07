import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Универсальный обработчик для Discord бота и REST API дашборда
    Args: event - HTTP request (Discord interaction или REST API), context - execution context
    Returns: JSON response
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return cors_response()
    
    headers = event.get('headers', {})
    headers_lower = {k.lower(): v for k, v in headers.items()}
    
    print(f"Request: method={method}, headers={list(headers_lower.keys())[:5]}")
    
    if 'x-signature-ed25519' in headers_lower or 'x-signature-timestamp' in headers_lower:
        print("Detected Discord request")
        return handle_discord_interaction(event)
    else:
        print("Detected API request")
        return handle_api_request(event)

def cors_response():
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp, X-User-Id',
            'Access-Control-Max-Age': '86400'
        },
        'body': '',
        'isBase64Encoded': False
    }

def handle_discord_interaction(event: Dict[str, Any]) -> Dict[str, Any]:
    headers = event.get('headers', {})
    body_str = event.get('body', '{}')
    
    print(f"All headers: {headers}")
    
    headers_lower = {k.lower(): v for k, v in headers.items()}
    
    signature = headers_lower.get('x-signature-ed25519', '')
    timestamp = headers_lower.get('x-signature-timestamp', '')
    public_key = os.environ.get('DISCORD_PUBLIC_KEY', '')
    
    print(f"Discord verification: sig={signature[:20] if signature else 'MISSING'}..., ts={timestamp if timestamp else 'MISSING'}, key={public_key[:20]}...")
    
    if not signature or not timestamp:
        print(f"Missing Discord headers!")
        return create_json_response({'error': 'Missing signature headers'}, 401)
    
    if not verify_discord_signature(body_str, signature, timestamp, public_key):
        print(f"Verification failed!")
        return create_json_response({'error': 'Invalid signature'}, 401)
    
    body = json.loads(body_str)
    interaction_type = body.get('type', 0)
    
    if interaction_type == 1:
        return create_json_response({'type': 1})
    
    if interaction_type == 2:
        return handle_discord_command(body)
    
    return create_json_response({'error': 'Unknown interaction'}, 400)

def verify_discord_signature(body: str, signature: str, timestamp: str, public_key: str) -> bool:
    try:
        from nacl.signing import VerifyKey
        verify_key = VerifyKey(bytes.fromhex(public_key))
        message = timestamp.encode() + body.encode()
        verify_key.verify(message, bytes.fromhex(signature))
        return True
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

def handle_discord_command(interaction: Dict[str, Any]) -> Dict[str, Any]:
    data = interaction.get('data', {})
    command_name = data.get('name', '')
    guild_id = interaction.get('guild_id', '')
    user = interaction.get('member', {}).get('user', {})
    user_id = user.get('id', '')
    user_name = user.get('username', 'Unknown')
    
    if not guild_id:
        return discord_response('Команда доступна только на серверах!', ephemeral=True)
    
    conn = get_db_connection()
    ensure_server_exists(conn, guild_id, interaction.get('guild', {}).get('name', 'Unknown'))
    
    if command_name == 'vote':
        options = data.get('options', [{}])[0]
        subcommand = options.get('name', '')
        
        if subcommand == 'info':
            result = discord_info(conn, guild_id)
        elif subcommand == 'register':
            result = discord_register(conn, guild_id, user_id, user_name, options)
        elif subcommand == 'withdraw':
            result = discord_withdraw(conn, guild_id, user_id)
        elif subcommand == 'cast':
            result = discord_cast(conn, guild_id, user_id, user_name, options)
        elif subcommand == 'list':
            result = discord_list(conn, guild_id)
        else:
            result = discord_response('Неизвестная подкоманда', ephemeral=True)
    else:
        result = discord_response('Неизвестная команда', ephemeral=True)
    
    conn.close()
    return result

def discord_info(conn, guild_id: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT * FROM elections WHERE server_id = %s AND status IN ('registration', 'voting') ORDER BY created_at DESC LIMIT 1",
        (guild_id,)
    )
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return discord_response('На данный момент нет активных выборов', ephemeral=True)
    
    cursor.execute("SELECT COUNT(*) as count FROM candidates WHERE election_id = %s", (election['id'],))
    candidate_count = cursor.fetchone()['count']
    
    status_text = {'registration': '📝 Регистрация кандидатов', 'voting': '🗳️ Голосование'}.get(election['status'], election['status'])
    required_votes = int(election['server_member_count'] * election['min_votes_threshold_percent'] / 100)
    
    embed = {
        'title': f"🏛️ {election['title']}",
        'description': election['description'],
        'color': 0x5865F2,
        'fields': [
            {'name': 'Статус', 'value': status_text, 'inline': True},
            {'name': 'Кандидатов', 'value': str(candidate_count), 'inline': True},
            {'name': 'Голосов', 'value': f"{election['total_votes']}/{required_votes}", 'inline': True}
        ]
    }
    
    cursor.close()
    return discord_response('', embeds=[embed])

def discord_register(conn, guild_id: str, user_id: str, user_name: str, options: Dict):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT * FROM elections WHERE server_id = %s AND status = 'registration' ORDER BY created_at DESC LIMIT 1",
        (guild_id,)
    )
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return discord_response('❌ Сейчас не проводится регистрация', ephemeral=True)
    
    cursor.execute("SELECT * FROM candidates WHERE election_id = %s AND user_id = %s", (election['id'], user_id))
    if cursor.fetchone():
        cursor.close()
        return discord_response('❌ Вы уже зарегистрированы', ephemeral=True)
    
    speech_option = next((opt for opt in options.get('options', []) if opt.get('name') == 'speech'), None)
    speech = speech_option.get('value', '') if speech_option else ''
    
    if not speech:
        cursor.close()
        return discord_response('❌ Необходимо указать предвыборную речь', ephemeral=True)
    
    candidate_id = f"{election['id']}_{user_id}"
    cursor.execute(
        "INSERT INTO candidates (id, election_id, user_id, user_name, speech) VALUES (%s, %s, %s, %s, %s)",
        (candidate_id, election['id'], user_id, user_name, speech)
    )
    conn.commit()
    cursor.close()
    
    return discord_response(f'✅ Вы зарегистрированы как кандидат в "{election["title"]}"')

def discord_withdraw(conn, guild_id: str, user_id: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT * FROM elections WHERE server_id = %s AND status = 'registration' ORDER BY created_at DESC LIMIT 1",
        (guild_id,)
    )
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return discord_response('❌ Сейчас не проводится регистрация', ephemeral=True)
    
    cursor.execute("SELECT * FROM candidates WHERE election_id = %s AND user_id = %s", (election['id'], user_id))
    candidate = cursor.fetchone()
    
    if not candidate:
        cursor.close()
        return discord_response('❌ Вы не зарегистрированы', ephemeral=True)
    
    cursor.execute("DELETE FROM candidates WHERE id = %s", (candidate['id'],))
    conn.commit()
    cursor.close()
    
    return discord_response('✅ Вы сняли свою кандидатуру')

def discord_cast(conn, guild_id: str, user_id: str, user_name: str, options: Dict):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT * FROM elections WHERE server_id = %s AND status = 'voting' ORDER BY created_at DESC LIMIT 1",
        (guild_id,)
    )
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return discord_response('❌ Сейчас не проводится голосование', ephemeral=True)
    
    cursor.execute("SELECT * FROM votes WHERE election_id = %s AND user_id = %s", (election['id'], user_id))
    if cursor.fetchone():
        cursor.close()
        return discord_response('❌ Вы уже проголосовали', ephemeral=True)
    
    candidate_option = next((opt for opt in options.get('options', []) if opt.get('name') == 'candidate'), None)
    if not candidate_option:
        cursor.close()
        return discord_response('❌ Необходимо указать кандидата', ephemeral=True)
    
    candidate_user_id = candidate_option.get('value', '')
    
    if candidate_user_id == user_id:
        cursor.close()
        return discord_response('❌ Вы не можете голосовать за себя', ephemeral=True)
    
    cursor.execute("SELECT * FROM candidates WHERE election_id = %s AND user_id = %s", (election['id'], candidate_user_id))
    candidate = cursor.fetchone()
    
    if not candidate:
        cursor.close()
        return discord_response('❌ Кандидат не найден', ephemeral=True)
    
    cursor.execute(
        "INSERT INTO votes (election_id, user_id, user_name, candidate_id) VALUES (%s, %s, %s, %s)",
        (election['id'], user_id, user_name, candidate['id'])
    )
    cursor.execute("UPDATE candidates SET votes = votes + 1 WHERE id = %s", (candidate['id'],))
    cursor.execute("UPDATE elections SET total_votes = total_votes + 1 WHERE id = %s", (election['id'],))
    conn.commit()
    cursor.close()
    
    return discord_response(f'✅ Ваш голос учтён! Вы проголосовали за {candidate["user_name"]}')

def discord_list(conn, guild_id: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT * FROM elections WHERE server_id = %s AND status IN ('registration', 'voting') ORDER BY created_at DESC LIMIT 1",
        (guild_id,)
    )
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return discord_response('❌ Нет активных выборов', ephemeral=True)
    
    cursor.execute(
        "SELECT * FROM candidates WHERE election_id = %s ORDER BY votes DESC, registered_at ASC",
        (election['id'],)
    )
    candidates = cursor.fetchall()
    
    if not candidates:
        cursor.close()
        return discord_response('📋 Пока нет кандидатов', ephemeral=True)
    
    description = '\n\n'.join([
        f"**{i+1}. {c['user_name']}** {('(' + str(c['votes']) + ' голосов)') if election['status'] == 'voting' else ''}\n*{c['speech']}*"
        for i, c in enumerate(candidates)
    ])
    
    embed = {
        'title': f"📋 Кандидаты: {election['title']}",
        'description': description,
        'color': 0x5865F2,
        'footer': {'text': f'Всего кандидатов: {len(candidates)}'}
    }
    
    cursor.close()
    return discord_response('', embeds=[embed])

def discord_response(content: str, embeds: List = None, ephemeral: bool = False):
    data = {}
    if content:
        data['content'] = content
    if embeds:
        data['embeds'] = embeds
    if ephemeral:
        data['flags'] = 64
    
    return create_json_response({'type': 4, 'data': data})

def handle_api_request(event: Dict[str, Any]) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    query = event.get('queryStringParameters', {}) or {}
    body_str = event.get('body', '{}')
    body = json.loads(body_str) if body_str else {}
    
    if method == 'POST' and '/register-commands' in path:
        return api_register_discord_commands(body)
    
    conn = get_db_connection()
    
    try:
        if method == 'GET':
            if '/servers' in path:
                result = api_get_servers(conn)
            elif '/elections' in path:
                result = api_get_elections(conn, query.get('server_id'))
            else:
                result = {'error': 'Unknown endpoint'}
                conn.close()
                return create_json_response(result, 404)
        
        elif method == 'POST':
            if '/elections/create' in path:
                result = api_create_election(conn, body)
            elif '/elections/start-registration' in path:
                result = api_start_registration(conn, body.get('election_id'))
            elif '/elections/start-voting' in path:
                result = api_start_voting(conn, body.get('election_id'))
            elif '/elections/complete' in path:
                result = api_complete_election(conn, body.get('election_id'))
            elif '/candidates/add' in path:
                result = api_add_candidate(conn, body)
            elif '/candidates/remove' in path:
                result = api_remove_candidate(conn, body.get('candidate_id'))
            elif '/votes/cast' in path:
                result = api_cast_vote(conn, body)
            else:
                result = {'error': 'Unknown endpoint'}
                conn.close()
                return create_json_response(result, 404)
        
        elif method == 'PUT':
            if '/elections/update' in path:
                result = api_update_election(conn, body)
            else:
                result = {'error': 'Unknown endpoint'}
                conn.close()
                return create_json_response(result, 404)
        
        else:
            conn.close()
            return create_json_response({'error': 'Method not allowed'}, 405)
        
        conn.close()
        return create_json_response(result)
    
    except Exception as e:
        conn.close()
        return create_json_response({'error': str(e)}, 500)

def api_get_servers(conn):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM servers ORDER BY added_at DESC")
    servers = cursor.fetchall()
    
    result = []
    for server in servers:
        cursor.execute("SELECT user_name FROM bot_admins WHERE server_id = %s", (server['id'],))
        admins = [row['user_name'] for row in cursor.fetchall()]
        
        result.append({
            'id': server['id'],
            'name': server['name'],
            'icon': server['icon'],
            'memberCount': server['member_count'],
            'botAdmins': admins
        })
    
    cursor.close()
    return {'servers': result}

def api_get_elections(conn, server_id: str = None):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if server_id:
        cursor.execute("SELECT * FROM elections WHERE server_id = %s ORDER BY created_at DESC", (server_id,))
    else:
        cursor.execute("SELECT * FROM elections ORDER BY created_at DESC")
    
    elections = cursor.fetchall()
    result = []
    
    for election in elections:
        cursor.execute(
            "SELECT * FROM candidates WHERE election_id = %s ORDER BY votes DESC",
            (election['id'],)
        )
        candidates = cursor.fetchall()
        
        cursor.execute("SELECT user_name, candidate_id FROM votes WHERE election_id = %s", (election['id'],))
        user_votes = {row['user_name']: row['candidate_id'] for row in cursor.fetchall()}
        
        result.append({
            'id': election['id'],
            'serverId': election['server_id'],
            'title': election['title'],
            'description': election['description'],
            'status': election['status'],
            'assignedRoles': election['assigned_roles'],
            'candidateRoles': election['candidate_roles'],
            'voterRoles': election['voter_roles'],
            'duration': election['duration'],
            'registrationDuration': election['registration_duration'],
            'termDuration': election['term_duration'],
            'daysBeforeTermEnd': election['days_before_term_end'],
            'minVotesThresholdPercent': election['min_votes_threshold_percent'],
            'serverMemberCount': election['server_member_count'],
            'keepOldRoles': election['keep_old_roles'],
            'autoStart': election['auto_start'],
            'retryOnFail': election['retry_on_fail'],
            'maxVotingAttempts': election['max_voting_attempts'],
            'registrationAttempts': election['registration_attempts'],
            'votingAttempts': election['voting_attempts'],
            'totalVotes': election['total_votes'],
            'registrationStartDate': election['registration_start_date'].isoformat() if election['registration_start_date'] else None,
            'registrationEndDate': election['registration_end_date'].isoformat() if election['registration_end_date'] else None,
            'votingStartDate': election['voting_start_date'].isoformat() if election['voting_start_date'] else None,
            'votingEndDate': election['voting_end_date'].isoformat() if election['voting_end_date'] else None,
            'termEndDate': election['term_end_date'].isoformat() if election['term_end_date'] else None,
            'currentWinner': election['current_winner'],
            'winnerUserId': election['winner_user_id'],
            'userVotes': user_votes,
            'candidates': [
                {
                    'id': c['id'],
                    'name': c['user_name'],
                    'avatar': c['avatar'],
                    'votes': c['votes'],
                    'speech': c['speech'],
                    'registeredAt': c['registered_at'].isoformat()
                }
                for c in candidates
            ]
        })
    
    cursor.close()
    return {'elections': result}

def api_create_election(conn, data: Dict):
    election_id = f"election_{int(datetime.now().timestamp() * 1000)}"
    cursor = conn.cursor()
    
    cursor.execute(
        """
        INSERT INTO elections (
            id, server_id, title, description, status,
            assigned_roles, candidate_roles, voter_roles,
            duration, registration_duration, term_duration, days_before_term_end,
            min_votes_threshold_percent, server_member_count,
            keep_old_roles, auto_start, retry_on_fail, max_voting_attempts
        ) VALUES (%s, %s, %s, %s, 'scheduled', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            election_id, data['serverId'], data['title'], data.get('description', ''),
            data['assignedRoles'], data.get('candidateRoles', []), data.get('voterRoles', []),
            data['duration'], data['registrationDuration'], data['termDuration'], data.get('daysBeforeTermEnd', 2),
            data.get('minVotesThresholdPercent', 20), data['serverMemberCount'],
            data.get('keepOldRoles', False), data.get('autoStart', True),
            data.get('retryOnFail', True), data.get('maxVotingAttempts', 2)
        )
    )
    conn.commit()
    cursor.close()
    
    return {'success': True, 'electionId': election_id}

def api_update_election(conn, data: Dict):
    cursor = conn.cursor()
    
    cursor.execute(
        """
        UPDATE elections SET
            title = %s, description = %s,
            assigned_roles = %s, candidate_roles = %s, voter_roles = %s,
            duration = %s, registration_duration = %s, term_duration = %s, days_before_term_end = %s,
            min_votes_threshold_percent = %s, server_member_count = %s,
            keep_old_roles = %s, auto_start = %s, retry_on_fail = %s, max_voting_attempts = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """,
        (
            data['title'], data.get('description', ''),
            data['assignedRoles'], data.get('candidateRoles', []), data.get('voterRoles', []),
            data['duration'], data['registrationDuration'], data['termDuration'], data.get('daysBeforeTermEnd', 2),
            data.get('minVotesThresholdPercent', 20), data['serverMemberCount'],
            data.get('keepOldRoles', False), data.get('autoStart', True),
            data.get('retryOnFail', True), data.get('maxVotingAttempts', 2),
            data['id']
        )
    )
    conn.commit()
    cursor.close()
    
    return {'success': True}

def api_start_registration(conn, election_id: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT registration_duration FROM elections WHERE id = %s", (election_id,))
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return {'error': 'Election not found'}
    
    now = datetime.now()
    end = now + timedelta(hours=election['registration_duration'])
    
    cursor.execute(
        """
        UPDATE elections SET status = 'registration', registration_start_date = %s,
        registration_end_date = %s, registration_attempts = registration_attempts + 1,
        updated_at = CURRENT_TIMESTAMP WHERE id = %s
        """,
        (now, end, election_id)
    )
    conn.commit()
    cursor.close()
    
    return {'success': True}

def api_start_voting(conn, election_id: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT duration FROM elections WHERE id = %s", (election_id,))
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return {'error': 'Election not found'}
    
    now = datetime.now()
    end = now + timedelta(hours=election['duration'])
    
    cursor.execute(
        """
        UPDATE elections SET status = 'voting', voting_start_date = %s,
        voting_end_date = %s, voting_attempts = voting_attempts + 1,
        updated_at = CURRENT_TIMESTAMP WHERE id = %s
        """,
        (now, end, election_id)
    )
    cursor.execute("DELETE FROM votes WHERE election_id = %s", (election_id,))
    cursor.execute("UPDATE candidates SET votes = 0 WHERE election_id = %s", (election_id,))
    cursor.execute("UPDATE elections SET total_votes = 0 WHERE id = %s", (election_id,))
    conn.commit()
    cursor.close()
    
    return {'success': True}

def api_complete_election(conn, election_id: str):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM elections WHERE id = %s", (election_id,))
    election = cursor.fetchone()
    
    if not election:
        cursor.close()
        return {'error': 'Election not found'}
    
    required_votes = int(election['server_member_count'] * election['min_votes_threshold_percent'] / 100)
    cursor.execute("SELECT * FROM candidates WHERE election_id = %s ORDER BY votes DESC LIMIT 1", (election_id,))
    winner = cursor.fetchone()
    
    if election['total_votes'] >= required_votes and winner:
        term_end = datetime.now() + timedelta(hours=election['term_duration'])
        cursor.execute(
            "UPDATE elections SET status = 'completed', current_winner = %s, winner_user_id = %s, term_end_date = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (winner['user_name'], winner['user_id'], term_end, election_id)
        )
        conn.commit()
        cursor.close()
        return {'success': True, 'winner': winner['user_name']}
    else:
        if election['retry_on_fail'] and election['voting_attempts'] < election['max_voting_attempts']:
            cursor.close()
            return api_start_voting(conn, election_id)
        elif election['retry_on_fail']:
            cursor.execute("UPDATE elections SET voting_attempts = 0 WHERE id = %s", (election_id,))
            cursor.execute("DELETE FROM candidates WHERE election_id = %s", (election_id,))
            cursor.execute("DELETE FROM votes WHERE election_id = %s", (election_id,))
            conn.commit()
            cursor.close()
            return api_start_registration(conn, election_id) if election['auto_start'] else {'success': True}
        else:
            cursor.execute("UPDATE elections SET status = 'failed' WHERE id = %s", (election_id,))
            conn.commit()
            cursor.close()
            return {'success': True, 'status': 'failed'}

def api_add_candidate(conn, data: Dict):
    candidate_id = f"candidate_{int(datetime.now().timestamp() * 1000)}"
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO candidates (id, election_id, user_id, user_name, avatar, speech) VALUES (%s, %s, %s, %s, %s, %s)",
        (candidate_id, data['electionId'], data['userId'], data['userName'], data.get('avatar', '👤'), data['speech'])
    )
    conn.commit()
    cursor.close()
    
    return {'success': True, 'candidateId': candidate_id}

def api_remove_candidate(conn, candidate_id: str):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM candidates WHERE id = %s", (candidate_id,))
    conn.commit()
    cursor.close()
    
    return {'success': True}

def api_cast_vote(conn, data: Dict):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM votes WHERE election_id = %s AND user_id = %s", (data['electionId'], data['userId']))
    
    if cursor.fetchone():
        cursor.close()
        return {'error': 'Already voted'}
    
    cursor.execute(
        "INSERT INTO votes (election_id, user_id, user_name, candidate_id) VALUES (%s, %s, %s, %s)",
        (data['electionId'], data['userId'], data['userName'], data['candidateId'])
    )
    cursor.execute("UPDATE candidates SET votes = votes + 1 WHERE id = %s", (data['candidateId'],))
    cursor.execute("UPDATE elections SET total_votes = total_votes + 1 WHERE id = %s", (data['electionId'],))
    conn.commit()
    cursor.close()
    
    return {'success': True}

def ensure_server_exists(conn, guild_id: str, guild_name: str):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO servers (id, name, member_count) VALUES (%s, %s, 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP",
        (guild_id, guild_name)
    )
    conn.commit()
    cursor.close()

def api_register_discord_commands(data: Dict):
    import urllib.request
    
    application_id = data.get('applicationId', '')
    bot_token = data.get('botToken', '')
    
    if not application_id or not bot_token:
        return create_json_response({'error': 'Missing applicationId or botToken'}, 400)
    
    commands_data = {
        "name": "vote",
        "description": "Управление выборами на сервере",
        "options": [
            {"name": "info", "description": "Информация о текущих выборах", "type": 1},
            {
                "name": "register",
                "description": "Выдвинуть свою кандидатуру",
                "type": 1,
                "options": [
                    {"name": "speech", "description": "Ваша предвыборная речь", "type": 3, "required": True}
                ]
            },
            {"name": "withdraw", "description": "Снять свою кандидатуру", "type": 1},
            {
                "name": "cast",
                "description": "Проголосовать за кандидата",
                "type": 1,
                "options": [
                    {"name": "candidate", "description": "Выберите кандидата", "type": 6, "required": True}
                ]
            },
            {"name": "list", "description": "Список всех кандидатов", "type": 1}
        ]
    }
    
    url = f"https://discord.com/api/v10/applications/{application_id}/commands"
    headers = {
        'Authorization': f'Bot {bot_token}',
        'Content-Type': 'application/json'
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(commands_data).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return create_json_response({'success': True, 'data': result})
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
        except:
            error_data = {'message': error_body}
        return create_json_response({'success': False, 'error': error_data}, e.code)
    except Exception as e:
        return create_json_response({'success': False, 'error': str(e)}, 500)

def get_db_connection():
    return psycopg2.connect(os.environ.get('DATABASE_URL', ''))

def create_json_response(data: Dict, status: int = 200):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(data),
        'isBase64Encoded': False
    }