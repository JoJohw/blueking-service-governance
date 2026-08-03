const axios = require('axios');
const {AUTH_HEADERS} = require('../common');
const {pollUntil} = require('./poll');

/**
 * List Helm deploy records via API.
 *
 * @param {Object} options
 * @param {string} options.appID - Application ID (required).
 * @param {string} options.envName - Environment name (required).
 * @param {string} [options.trafficLaneName] - Traffic lane name filter.
 * @param {number} [options.pageSize=10] - Page size.
 * @returns {Promise<Array<Object>>} latest-first list of deploy records.
 */
async function listDeploys(options = {}) {
  if (!options.appID) {
    throw new Error('Application ID is required');
  }
  if (!options.envName) {
    throw new Error('Environment name is required');
  }

  const serviceURL = bru.getEnvVar('serviceURL');
  const response = await axios.get(
    `${serviceURL}/apps/${options.appID}/envs/${options.envName}/helm-deploys`,
    {
      headers: AUTH_HEADERS,
      params: {
        page: 1,
        pageSize: options.pageSize || 10,
        trafficLaneName: options.trafficLaneName || ''
      }
    }
  );
  return response.data?.data?.results || [];
}

/**
 * Wait until the latest Helm deploy record matches the expected state.
 *
 * Matching rules (all optional, AND'd together):
 *   - `expectedStatus`: status string or array (e.g. 'deployed', ['deployed','succeeded'])
 *   - `imageTag`: latest record's imageTag must equal this value
 *   - `excludeID`: latest record's id must differ from this value (i.e. wait for a NEW record)
 *
 * @param {Object} options
 * @param {string} options.appID - Application ID (required).
 * @param {string} options.envName - Environment name (required).
 * @param {string|string[]} [options.expectedStatus] - Expected latest record status.
 * @param {string} [options.imageTag] - Expected image tag.
 * @param {string} [options.excludeID] - Ignore this record id.
 * @param {string} [options.trafficLaneName] - Traffic lane filter.
 * @param {number} [options.timeoutMs=120000] - Override default timeout (ms).
 * @param {number} [options.intervalMs=1000] - Poll interval (ms).
 * @returns {Promise<Object>} the matched record.
 */
async function waitForDeploy(options = {}) {
  const expectedStatuses = options.expectedStatus
    ? (Array.isArray(options.expectedStatus) ? options.expectedStatus : [options.expectedStatus])
    : null;
  const timeoutMs = options.timeoutMs || 120000;
  const label = `helm deploy [app=${options.appID}, env=${options.envName}, status=${expectedStatuses || '*'}]`;

  const matched = await pollUntil({
    fn: async () => {
      const records = await listDeploys({
        appID: options.appID,
        envName: options.envName,
        trafficLaneName: options.trafficLaneName
      });
      return records[0];
    },
    predicate: (record) => {
      if (!record) return false;
      if (expectedStatuses && !expectedStatuses.includes(record.status)) return false;
      if (options.imageTag && record.imageTag !== options.imageTag) return false;
      if (options.excludeID && record.id === options.excludeID) return false;
      return true;
    },
    timeoutMs,
    intervalMs: options.intervalMs || 1000,
    label
  });
  return matched;
}

module.exports = {
  listDeploys,
  waitForDeploy
};
