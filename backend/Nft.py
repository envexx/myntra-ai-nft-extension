import requests
from exceptions import APIError

class NFTAPI:
    def __init__(self, api_key, base_url="https://api.unleashnfts.com/api/v2"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "accept": "application/json",
            "x-api-key": self.api_key
        }
    
    def get_nft_traders(self, contract_addresses, token_ids, blockchain='ethereum', time_range='24h', sort_by='traders', sort_order='desc', offset=0, limit=30):
        """
        Fetch trader data for specified NFTs.

        :param contract_addresses: list of str, contract addresses of the NFTs
        :param token_ids: list of str, token IDs of the NFTs
        :param blockchain: str, blockchain type, defaults to 'ethereum'
        :param time_range: str, time range for filtering the results, defaults to '24h'
        :param sort_by: str, property to sort the results by, defaults to 'traders'
        :param sort_order: str, order to sort the result set by, defaults to 'desc'
        :param offset: int, pagination offset, defaults to 0
        :param limit: int, number of items to return, defaults to 30
        :return: dict, the JSON response containing NFT trader data
        """
        contract_address_param = ','.join(contract_addresses) if isinstance(contract_addresses, list) else contract_addresses
        token_id_param = ','.join(token_ids) if isinstance(token_ids, list) else token_ids
        url = f"{self.base_url}/nft/traders?contract_address={contract_address_param}&token_id={token_id_param}&blockchain={blockchain}&time_range={time_range}&sort_by={sort_by}&sort_order={sort_order}&offset={offset}&limit={limit}"
        response = requests.get(url, headers=self.headers)
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Failed to fetch NFT traders data: {str(e)}")
        
    def get_nft_analytics(self, contract_addresses, token_ids, blockchain='ethereum', time_range='24h', sort_by='sales', sort_order='desc', offset=0, limit=30):
        """
        Fetch analytics data for specified NFTs.

        :param contract_addresses: list of str, contract addresses of the NFTs
        :param token_ids: list of str, token IDs of the NFTs
        :param blockchain: str, blockchain type, defaults to 'ethereum'
        :param time_range: str, time range for filtering the results, defaults to '24h'
        :param sort_by: str, property to sort the results by, defaults to 'sales'
        :param sort_order: str, order to sort the result set by, defaults to 'desc'
        :param offset: int, pagination offset, defaults to 0
        :param limit: int, number of items to return, defaults to 30
        :return: dict, the JSON response containing NFT analytics data
        """
        contract_address_param = ','.join(contract_addresses) if isinstance(contract_addresses, list) else contract_addresses
        token_id_param = ','.join(token_ids) if isinstance(token_ids, list) else token_ids
        url = f"{self.base_url}/nft/analytics?contract_address={contract_address_param}&token_id={token_id_param}&blockchain={blockchain}&time_range={time_range}&sort_by={sort_by}&sort_order={sort_order}&offset={offset}&limit={limit}"
        response = requests.get(url, headers=self.headers)
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Failed to fetch NFT analytics data: {str(e)}")

    def get_nft_washtrade(self, contract_addresses, token_ids, blockchain='ethereum', time_range='24h', sort_by='washtrade_volume', sort_order='desc', offset=0, limit=30):
        """
        Fetch washtrade data for specified NFTs.

        :param contract_addresses: list of str, contract addresses of the NFTs
        :param token_ids: list of str, token IDs of the NFTs
        :param blockchain: str, blockchain type, defaults to 'ethereum'
        :param time_range: str, time range for filtering the results, defaults to '24h'
        :param sort_by: str, property to sort the results by, defaults to 'washtrade_volume'
        :param sort_order: str, order to sort the result set by, defaults to 'desc'
        :param offset: int, pagination offset, defaults to 0
        :param limit: int, number of items to return, defaults to 30
        :return: dict, the JSON response containing NFT washtrade data
        """
        contract_address_param = ','.join(contract_addresses) if isinstance(contract_addresses, list) else contract_addresses
        token_id_param = ','.join(token_ids) if isinstance(token_ids, list) else token_ids
        url = f"{self.base_url}/nft/washtrade?contract_address={contract_address_param}&token_id={token_id_param}&blockchain={blockchain}&time_range={time_range}&sort_by={sort_by}&sort_order={sort_order}&offset={offset}&limit={limit}"
        response = requests.get(url, headers=self.headers)
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Failed to fetch NFT washtrade data: {str(e)}")

    def get_nft_holders(self, contract_addresses, token_ids, blockchain='ethereum', time_range='24h', sort_by='past_owners_count', sort_order='desc', offset=0, limit=30):
        """
        Fetch holder data for specified NFTs.

        :param contract_addresses: list of str, contract addresses of the NFTs
        :param token_ids: list of str, token IDs of the NFTs
        :param blockchain: str, blockchain type, defaults to 'ethereum'
        :param time_range: str, time range for filtering the results, defaults to '24h'
        :param sort_by: str, property to sort the results by, defaults to 'past_owners_count'
        :param sort_order: str, order to sort the result set by, defaults to 'desc'
        :param offset: int, pagination offset, defaults to 0
        :param limit: int, number of items to return, defaults to 30
        :return: dict, the JSON response containing NFT holder data
        """
        contract_address_param = ','.join(contract_addresses) if isinstance(contract_addresses, list) else contract_addresses
        token_id_param = ','.join(token_ids) if isinstance(token_ids, list) else token_ids
        url = f"{self.base_url}/nft/holders?contract_address={contract_address_param}&token_id={token_id_param}&blockchain={blockchain}&time_range={time_range}&sort_by={sort_by}&sort_order={sort_order}&offset={offset}&limit={limit}"
        response = requests.get(url, headers=self.headers)
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Failed to fetch NFT holders data: {str(e)}")

    def get_nft_scores(self, contract_addresses, token_ids, blockchain='ethereum', time_range='24h', sort_by='price_ceiling', sort_order='desc', offset=0, limit=30):
        """
        Fetch scores data for specified NFTs.

        :param contract_addresses: list of str, contract addresses of the NFTs
        :param token_ids: list of str, token IDs of the NFTs
        :param blockchain: str, blockchain type, defaults to 'ethereum'
        :param time_range: str, time range for filtering the results, defaults to '24h'
        :param sort_by: str, property to sort the results by, defaults to 'price_ceiling'
        :param sort_order: str, order to sort the result set by, defaults to 'desc'
        :param offset: int, pagination offset, defaults to 0
        :param limit: int, number of items to return, defaults to 30
        :return: dict, the JSON response containing NFT scores data
        """
        contract_address_param = ','.join(contract_addresses) if isinstance(contract_addresses, list) else contract_addresses
        token_id_param = ','.join(token_ids) if isinstance(token_ids, list) else token_ids
        url = f"{self.base_url}/nft/scores?contract_address={contract_address_param}&token_id={token_id_param}&blockchain={blockchain}&time_range={time_range}&sort_by={sort_by}&sort_order={sort_order}&offset={offset}&limit={limit}"
        response = requests.get(url, headers=self.headers)
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Failed to fetch NFT scores data: {str(e)}")

    def get_nft_top_deals(self, sort_by='deal_score', sort_order='desc', offset=0, limit=30):
        """
        Fetch top deal data for NFTs.

        :param sort_by: str, property to sort the results by, defaults to 'deal_score'
        :param sort_order: str, order to sort the result set by, defaults to 'desc'
        :param offset: int, pagination offset, defaults to 0
        :param limit: int, number of items to return, defaults to 30
        :return: dict, the JSON response containing NFT top deals data
        """
        url = f"{self.base_url}/nft/top_deals?sort_by={sort_by}&sort_order={sort_order}&offset={offset}&limit={limit}"
        response = requests.get(url, headers=self.headers)
        try:
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise APIError(f"Failed to fetch NFT top deals data: {str(e)}")
