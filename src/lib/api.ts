const API_URL = 'https://functions.poehali.dev/97ae06e9-9c5e-49f5-baf2-e1e54dd0677d';

export const api = {
  async getServers() {
    const response = await fetch(`${API_URL}/servers`);
    if (!response.ok) throw new Error('Failed to fetch servers');
    return response.json();
  },

  async getElections(serverId?: string) {
    const url = serverId ? `${API_URL}/elections?server_id=${serverId}` : `${API_URL}/elections`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch elections');
    return response.json();
  },

  async createElection(data: any) {
    const response = await fetch(`${API_URL}/elections/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create election');
    return response.json();
  },

  async updateElection(data: any) {
    const response = await fetch(`${API_URL}/elections/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update election');
    return response.json();
  },

  async startRegistration(electionId: string) {
    const response = await fetch(`${API_URL}/elections/start-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ election_id: electionId })
    });
    if (!response.ok) throw new Error('Failed to start registration');
    return response.json();
  },

  async startVoting(electionId: string) {
    const response = await fetch(`${API_URL}/elections/start-voting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ election_id: electionId })
    });
    if (!response.ok) throw new Error('Failed to start voting');
    return response.json();
  },

  async completeElection(electionId: string) {
    const response = await fetch(`${API_URL}/elections/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ election_id: electionId })
    });
    if (!response.ok) throw new Error('Failed to complete election');
    return response.json();
  },

  async addCandidate(data: any) {
    const response = await fetch(`${API_URL}/candidates/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to add candidate');
    return response.json();
  },

  async removeCandidate(candidateId: string) {
    const response = await fetch(`${API_URL}/candidates/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: candidateId })
    });
    if (!response.ok) throw new Error('Failed to remove candidate');
    return response.json();
  },

  async castVote(data: any) {
    const response = await fetch(`${API_URL}/votes/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to cast vote');
    return response.json();
  }
};
