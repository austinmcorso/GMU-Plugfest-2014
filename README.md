GMU-Plugfest-2014
=================

    {
      "Alert": {
        "messageid": "TS-1407462007-0",
        "CreateTime": {
          "content": "2014-08-07T21:25:55Z",
          "ntpstamp": "0x53e3eee3.0x00000000"
        },
        "Analyzer": {
          "Node": {
            "name": "ZjgxMzM4.ZjM1MzE2"
          },
          "analyzerid": "ThreatSTOP"
        },
        "Source": {
          "Node": {
            "Address": {
              "address": "74.125.181.81",
              "category": "ipv4-addr"
            },
            "Service": {
              "port": "63150",
              "iana_protocol_name": "tcp",
              "protocol": "",
              "ip_version": "4"
            }
          }
        },
        "Target": {
          "Node": {
            "Address": {
              "address": "10.165.148.173",
              "category": "ipv4-addr"
            },
            "Service": {
              "port": "13568",
              "iana_protocol_name": "tcp",
              "protocol": "",
              "ip_version": "4"
            }
          }
        },
        "AdditionalData": [
          {
            "content": 1,
            "meaning": "direction"
          },
          {
            "content": "1",
            "meaning": "anon"
          },
          {
            "content": "1",
            "meaning": "version"
          },
          {
            "content": "[00001] 2014-08-07 21:25:55 [root]system-notification-00257(traffic): start_time=\"2014-08-07 21:25:54\" duration=1 policy_id=240 service=dns proto=17 src zone=untrust dst zone=dmz action=permit sent=90 rcvd=90 src=74.125.181.81 dst=10.165.148.173 src_port=63150 dst_port=13568 translated ip=74.125.181.81 port=63150",
            "meaning": "raw"
          }
        ]
      }
    }
