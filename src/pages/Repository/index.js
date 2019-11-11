import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, PageActions } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    issueStatus: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { issueStatus } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    console.log(issueStatus);

    const [repository, issues] = await Promise.all([
      await api.get(`/repos/${repoName}`),
      await api.get(`/repos/${repoName}/issues`, {
        params: {
          state: issueStatus,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async getIssues() {
    const { match } = this.props;
    const { issueStatus, page } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: issueStatus,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: response.data,
    });
  }

  handleStatusChange = async e => {
    await this.setState({ issueStatus: e.target.value });
    this.getIssues();
  };

  handlePage = async action => {
    const { page } = this.state;

    await this.setState({
      page: action === 'next' ? page + 1 : page - 1,
    });

    this.getIssues();
  };

  render() {
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos Repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <PageActions>
          <div>
            <p>Filtrar Issues por Status:</p>
            <select onChange={this.handleStatusChange}>
              <option value="all">Todos</option>
              <option value="open">Aberto</option>
              <option value="closed">Fechadas</option>
            </select>
          </div>

          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePage('back')}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button type="button" onClick={() => this.handlePage('next')}>
            Próximo
          </button>
        </PageActions>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
